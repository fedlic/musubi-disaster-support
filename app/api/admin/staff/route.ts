import { NextRequest, NextResponse } from "next/server";
import { getStaffAccess } from "@/lib/auth/access";
import { createAdminClient } from "@/lib/supabase/admin";

const roles = new Set(["super_admin", "municipal_admin", "coordinator", "dispatcher", "viewer"]);

async function managerAccess() {
  const access = await getStaffAccess();
  return access?.membership && ["super_admin", "municipal_admin"].includes(access.membership.role) ? access : null;
}

export async function POST(request: NextRequest) {
  const access = await managerAccess();
  if (!access?.membership) return NextResponse.json({ error: "管理権限がありません" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
  const role = typeof body?.role === "string" ? body.role : "";
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 80) : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !roles.has(role)) {
    return NextResponse.json({ error: "メールアドレスまたは権限を確認してください" }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { error } = await supabase.from("staff_invitations").upsert({
    organization_id: access.membership.organization_id,
    email,
    role,
    title: title || null,
    invited_by: access.user.id,
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    accepted_at: null,
  }, { onConflict: "organization_id,email" });
  if (error) return NextResponse.json({ error: "招待を登録できませんでした" }, { status: 500 });
  await supabase.from("audit_logs").insert({
    organization_id: access.membership.organization_id,
    actor_user_id: access.user.id,
    action: "staff.invite",
    resource_type: "staff_invitation",
    resource_id: email,
    metadata: { role, title: title || null },
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  const access = await managerAccess();
  if (!access?.membership) return NextResponse.json({ error: "管理権限がありません" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const membershipId = typeof body?.membershipId === "string" ? body.membershipId : "";
  const role = typeof body?.role === "string" ? body.role : "";
  const isActive = body?.isActive === true;
  if (!membershipId || !roles.has(role)) return NextResponse.json({ error: "更新内容が不正です" }, { status: 400 });
  if (membershipId === access.membership.id && !isActive) {
    return NextResponse.json({ error: "自分自身の権限は停止できません" }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { error } = await supabase.from("staff_memberships").update({ role, is_active: isActive })
    .eq("id", membershipId).eq("organization_id", access.membership.organization_id);
  if (error) return NextResponse.json({ error: "担当者を更新できませんでした" }, { status: 500 });
  await supabase.from("audit_logs").insert({
    organization_id: access.membership.organization_id,
    actor_user_id: access.user.id,
    action: "staff.update",
    resource_type: "staff_membership",
    resource_id: membershipId,
    metadata: { role, is_active: isActive },
  });
  return NextResponse.json({ ok: true });
}
