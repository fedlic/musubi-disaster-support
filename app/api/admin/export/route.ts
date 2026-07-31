import { NextResponse } from "next/server";
import { getStaffAccess } from "@/lib/auth/access";
import { createAdminClient } from "@/lib/supabase/admin";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"").replace(/^[=+\-@]/, "'$&")}"`;
}

export async function GET() {
  const access = await getStaffAccess();
  if (!access?.membership) return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  const admin = createAdminClient();
  const { data } = await admin.from("support_requests")
    .select("public_code,title,public_area,category,people_count,priority,status,is_verified,source,created_at,updated_at")
    .or(`organization_id.eq.${access.membership.organization_id},organization_id.is.null`)
    .order("created_at", { ascending: false });
  const headers = ["受付番号","タイトル","公開地域","支援種別","人数","優先度","状況","確認済","情報源","受付日時","更新日時"];
  const rows = (data ?? []).map((item) => Object.values(item).map(csvCell).join(","));
  const csv = "\uFEFF" + [headers.map(csvCell).join(","), ...rows].join("\r\n");
  await admin.from("audit_logs").insert({
    organization_id: access.membership.organization_id, actor_user_id: access.user.id,
    action: "requests.export", resource_type: "support_request", metadata: { count: data?.length ?? 0 },
  });
  return new NextResponse(csv, { headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="musubi-report-${new Date().toISOString().slice(0, 10)}.csv"`,
    "Cache-Control": "private, no-store",
  }});
}
