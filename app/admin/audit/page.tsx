import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaffAccess } from "@/lib/auth/access";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AuditPage() {
  const access = await getStaffAccess();
  if (!access?.membership) redirect("/login?next=/admin/audit");
  if (!["super_admin", "municipal_admin"].includes(access.membership.role)) redirect("/admin");
  const admin = createAdminClient();
  const { data } = await admin.from("audit_logs")
    .select("id,actor_user_id,action,resource_type,resource_id,metadata,created_at,profiles(display_name,email)")
    .eq("organization_id", access.membership.organization_id).order("created_at", { ascending: false }).limit(300);
  return (
    <main className="admin-page">
      <header className="admin-header"><Link href="/admin" className="back-link">← ダッシュボード</Link><div><p className="eyebrow">AUDIT LOG</p><h1>監査履歴</h1></div></header>
      <section className="staff-section">
        <div className="admin-panel-title"><div><h2>直近300件の操作</h2><p>担当者、時刻、操作対象を確認できます。</p></div></div>
        <div className="audit-table">
          {(data ?? []).map((log) => {
            const profile = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
            return <article key={log.id}><time>{new Date(log.created_at).toLocaleString("ja-JP")}</time><strong>{profile?.display_name || profile?.email || log.actor_user_id}</strong><span>{log.action}</span><small>{log.resource_type} / {log.resource_id || "—"}</small></article>;
          })}
          {!data?.length && <div className="empty-state">監査履歴はまだありません。</div>}
        </div>
      </section>
    </main>
  );
}
