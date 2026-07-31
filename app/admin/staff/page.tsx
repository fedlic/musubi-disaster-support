import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getStaffAccess, staffRoleLabels } from "@/lib/auth/access";

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
          {canManage && <button className="primary" disabled>担当者を招待</button>}
        </div>
        <div className="staff-table">
          {(staff ?? []).map((member) => {
            const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
            return (
              <article key={member.id}>
                <span className="avatar">{profile?.display_name?.slice(0, 1) || "担"}</span>
                <div><strong>{profile?.display_name || profile?.email || "担当者"}</strong><small>{member.title || staffRoleLabels[member.role]}</small></div>
                <span>{staffRoleLabels[member.role] || member.role}</span>
                <b className={member.is_active ? "staff-active" : ""}>{member.is_active ? "有効" : "停止"}</b>
              </article>
            );
          })}
          {!staff?.length && <div className="empty-state">担当者データはまだありません。</div>}
        </div>
        {!canManage && <p className="security-note">担当者の招待と権限変更は自治体管理者だけが行えます。</p>}
      </section>
    </main>
  );
}
