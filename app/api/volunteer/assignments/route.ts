import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function currentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  const admin = createAdminClient();
  const { data: assignments, error } = await admin.from("assignments")
    .select("id,request_id,assigned_at,completed_at,support_requests(public_code,title,public_area,category,people_count,public_detail,priority,status)")
    .eq("volunteer_id", user.id).order("assigned_at", { ascending: false });
  if (error) return NextResponse.json({ error: "担当案件を取得できませんでした" }, { status: 500 });
  return NextResponse.json({ assignments: assignments ?? [] });
}

export async function PATCH(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const assignmentId = typeof body?.assignmentId === "string" ? body.assignmentId : "";
  const action = body?.action === "start" || body?.action === "complete" ? body.action : "";
  if (!assignmentId || !action) return NextResponse.json({ error: "操作内容が不正です" }, { status: 400 });
  const admin = createAdminClient();
  const { data: assignment } = await admin.from("assignments")
    .select("id,request_id,organization_id").eq("id", assignmentId).eq("volunteer_id", user.id).maybeSingle();
  if (!assignment) return NextResponse.json({ error: "担当案件ではありません" }, { status: 403 });
  const status = action === "start" ? "in_progress" : "completed";
  await admin.from("support_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", assignment.request_id);
  if (action === "complete") await admin.from("assignments").update({ completed_at: new Date().toISOString() }).eq("id", assignment.id);
  await admin.from("audit_logs").insert({
    organization_id: assignment.organization_id, actor_user_id: user.id,
    action: `assignment.${action}`, resource_type: "support_request", resource_id: assignment.request_id,
  });
  return NextResponse.json({ ok: true });
}
