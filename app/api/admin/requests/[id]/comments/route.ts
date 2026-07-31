import { NextRequest, NextResponse } from "next/server";
import { getStaffAccess } from "@/lib/auth/access";
import { createAdminClient } from "@/lib/supabase/admin";

async function accessRequest(id: string) {
  const access = await getStaffAccess();
  if (!access?.membership) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("support_requests").select("id,organization_id").eq("id", id).maybeSingle();
  if (!data || (data.organization_id && data.organization_id !== access.membership.organization_id)) return null;
  return { access, admin };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await accessRequest(id);
  if (!result) return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  const { data } = await result.admin.from("audit_logs")
    .select("id,actor_user_id,metadata,created_at,profiles(display_name,email)")
    .eq("resource_id", id).eq("action", "request.comment").order("created_at");
  return NextResponse.json({ comments: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await accessRequest(id);
  if (!result) return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 1000) : "";
  if (!text) return NextResponse.json({ error: "コメントを入力してください" }, { status: 400 });
  const { error } = await result.admin.from("audit_logs").insert({
    organization_id: result.access.membership!.organization_id, actor_user_id: result.access.user.id,
    action: "request.comment", resource_type: "support_request", resource_id: id, metadata: { text },
  });
  return error ? NextResponse.json({ error: "コメントを保存できませんでした" }, { status: 500 }) : NextResponse.json({ ok: true });
}
