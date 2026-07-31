import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getStaffAccess } from "@/lib/auth/access";
import StaffManager from "./StaffManager";

export default async function StaffPage() {
  if (!isSupabaseConfigured()) redirect("/admin");
  const access = await getStaffAccess();
  if (!access) redirect("/login?next=/admin/staff");
  if (!access.membership) redirect("/admin");

  const canManage = ["super_admin", "municipal_admin"].includes(access.membership.role);
  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("staff_memberships")
    .select("id,user_id,role,title,is_active,created_at,profiles(display_name,email)")
    .eq("organization_id", access.membership.organization_id)
    .order("created_at");

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link href="/admin" className="back-link">← ダッシュボード</Link>
        <div><p className="eyebrow">STAFF ACCESS</p><h1>担当者と権限</h1></div>
        <span>{access.membership.organizations?.name}</span>
      </header>
      <section className="staff-section">
        <div className="admin-panel-title">
          <div><h2>登録担当者</h2><p>共有IDを使わず、操作した担当者を識別します。</p></div>
          <span>{canManage ? "招待・権限変更ができます" : "閲覧専用"}</span>
        </div>
        <StaffManager initialStaff={(staff ?? []) as never[]} canManage={canManage} />
        {!canManage && <p className="security-note">担当者の招待と権限変更は自治体管理者だけが行えます。</p>}
      </section>
    </main>
  );
}
