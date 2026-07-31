import { NextResponse } from "next/server";
import { getStaffAccess } from "@/lib/auth/access";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await getStaffAccess();
  if (!access?.membership) return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  const { id } = await context.params;
  const supabase = createAdminClient();
  const { data: target } = await supabase.from("support_requests").select("id,organization_id")
    .eq("id", id).maybeSingle();
  if (!target || (target.organization_id && target.organization_id !== access.membership.organization_id)) {
    return NextResponse.json({ error: "対象案件へアクセスできません" }, { status: 403 });
  }
  const { data, error } = await supabase.storage.from("request-attachments")
    .list(id, { limit: 10, sortBy: { column: "created_at", order: "asc" } });
  if (error) return NextResponse.json({ error: "添付写真を取得できませんでした" }, { status: 500 });
  const attachments = await Promise.all((data ?? []).map(async (item) => {
    const storagePath = `${id}/${item.name}`;
    const { data: signed } = await supabase.storage.from("request-attachments")
      .createSignedUrl(storagePath, 300);
    return {
      id: item.id ?? item.name,
      original_name: `現地写真.${item.name.split(".").pop() || "jpg"}`,
      content_type: item.metadata?.mimetype ?? "image/jpeg",
      size_bytes: item.metadata?.size ?? 0,
      created_at: item.created_at,
      url: signed?.signedUrl ?? null,
    };
  }));
  await supabase.from("audit_logs").insert({
    organization_id: access.membership.organization_id, actor_user_id: access.user.id,
    action: "attachments.view", resource_type: "support_request", resource_id: id,
    metadata: { count: attachments.length },
  });
  return NextResponse.json({ attachments }, { headers: { "Cache-Control": "private, no-store" } });
}
