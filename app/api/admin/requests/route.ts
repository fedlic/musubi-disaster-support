import { NextResponse, type NextRequest } from "next/server";
import { getStaffAccess } from "@/lib/auth/access";
import { createAdminClient } from "@/lib/supabase/admin";

const editableRoles = new Set(["super_admin", "municipal_admin", "coordinator", "dispatcher"]);
const validStatuses = new Set(["unverified", "unassigned", "assigned", "in_progress", "completed"]);
const validPriorities = new Set(["unverified", "normal", "priority", "urgent"]);

async function authorized() {
  const access = await getStaffAccess();
  return access?.membership ? access : null;
}

export async function GET() {
  const access = await authorized();
  if (!access?.membership) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const supabase = createAdminClient();
  const organizationId = access.membership.organization_id;
  const [{ data: requests, error }, { data: staff }, { data: assignments }] = await Promise.all([
    supabase
      .from("support_requests")
      .select("id,public_code,source,title,public_area,public_lat,public_lng,category,people_count,public_detail,priority,status,is_verified,created_at,updated_at")
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(250),
    supabase
      .from("staff_memberships")
      .select("user_id,role,title,is_active,profiles(display_name,email)")
      .eq("organization_id", organizationId)
      .eq("is_active", true),
    supabase
      .from("assignments")
      .select("id,request_id,volunteer_id,assigned_at,completed_at")
      .eq("organization_id", organizationId),
  ]);

  if (error) return NextResponse.json({ error: "要請を取得できませんでした" }, { status: 500 });
  const ids = (requests ?? []).map((item) => item.id);
  const { data: privateDetails } = ids.length
    ? await supabase
        .schema("private")
        .from("request_details")
        .select("request_id,exact_address,exact_lat,exact_lng,requester_name,contact_encrypted,sensitive_notes,consent_at")
        .in("request_id", ids)
    : { data: [] };

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_user_id: access.user.id,
    action: "requests.list",
    resource_type: "support_request",
    metadata: { count: requests?.length ?? 0 },
  });

  return NextResponse.json({
    requests: requests ?? [],
    privateDetails: privateDetails ?? [],
    assignments: assignments ?? [],
    staff: staff ?? [],
    canEdit: editableRoles.has(access.membership.role),
  });
}

export async function PATCH(request: NextRequest) {
  const access = await authorized();
  if (!access?.membership || !editableRoles.has(access.membership.role)) {
    return NextResponse.json({ error: "更新権限がありません" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const requestId = typeof body?.requestId === "string" ? body.requestId : "";
  const status = typeof body?.status === "string" ? body.status : "";
  const priority = typeof body?.priority === "string" ? body.priority : "";
  const assigneeId = typeof body?.assigneeId === "string" ? body.assigneeId : "";
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 140) : "";
  const publicArea = typeof body?.publicArea === "string" ? body.publicArea.trim().slice(0, 120) : "";
  const publicDetail = typeof body?.publicDetail === "string" ? body.publicDetail.trim().slice(0, 1200) : "";
  const exactAddress = typeof body?.exactAddress === "string" ? body.exactAddress.trim().slice(0, 240) : "";
  const publicLat = Number(body?.publicLat);
  const publicLng = Number(body?.publicLng);
  if (!requestId || !title || !publicArea || !publicDetail || !validStatuses.has(status) ||
      !validPriorities.has(priority) || !Number.isFinite(publicLat) || !Number.isFinite(publicLng) ||
      publicLat < 30 || publicLat > 35 || publicLng < 127 || publicLng > 133) {
    return NextResponse.json({ error: "更新内容が正しくありません" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const organizationId = access.membership.organization_id;
  const { data: target } = await supabase
    .from("support_requests")
    .select("id,organization_id")
    .eq("id", requestId)
    .maybeSingle();
  if (!target || (target.organization_id && target.organization_id !== organizationId)) {
    return NextResponse.json({ error: "対象案件へアクセスできません" }, { status: 403 });
  }

  const { error } = await supabase
    .from("support_requests")
    .update({
      organization_id: organizationId,
      title,
      public_area: publicArea,
      public_detail: publicDetail,
      public_lat: publicLat,
      public_lng: publicLng,
      status,
      priority,
      is_verified: status !== "unverified",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (error) return NextResponse.json({ error: "案件を更新できませんでした" }, { status: 500 });

  await supabase.schema("private").from("request_details").update({
    exact_address: exactAddress || null,
  }).eq("request_id", requestId);

  await supabase.from("assignments").delete().eq("request_id", requestId).eq("organization_id", organizationId);
  if (assigneeId) {
    const { data: member } = await supabase
      .from("staff_memberships")
      .select("user_id")
      .eq("organization_id", organizationId)
      .eq("user_id", assigneeId)
      .eq("is_active", true)
      .maybeSingle();
    if (member) {
      await supabase.from("assignments").insert({
        organization_id: organizationId,
        request_id: requestId,
        volunteer_id: assigneeId,
        assigned_by: access.user.id,
      });
    }
  }

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_user_id: access.user.id,
    action: "request.update",
    resource_type: "support_request",
    resource_id: requestId,
    metadata: { status, priority, assignee_id: assigneeId || null, public_area: publicArea },
  });
  return NextResponse.json({ ok: true });
}
