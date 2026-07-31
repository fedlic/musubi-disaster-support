import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaffAccess, staffRoleLabels } from "@/lib/auth/access";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="admin-page">
        <section className="admin-empty">
          <span className="brand-mark">結</span>
          <p className="eyebrow">ADMIN CONSOLE</p>
          <h1>管理者認証を準備しています</h1>
          <p>SupabaseとGoogle OAuthの接続後、担当者ごとのログインと権限管理が有効になります。</p>
          <Link href="/">公開マップへ戻る</Link>
        </section>
      </main>
    );
  }

  const access = await getStaffAccess();
  if (!access) redirect("/login?next=/admin");
  if (!access.membership) {
    return (
      <main className="admin-page">
        <section className="admin-empty">
          <p className="eyebrow">ACCESS PENDING</p>
          <h1>担当者権限が未登録です</h1>
          <p>{access.user.email} でログインしています。所属組織の管理者へ承認を依頼してください。</p>
          <form action="/auth/signout" method="post"><button>ログアウト</button></form>
        </section>
      </main>
    );
  }

  const organization = access.membership.organizations;
  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link href="/" className="about-brand">
          <span className="brand-mark">結</span>
          <span><small>災害対応 管理コンソール</small><strong>むすび</strong></span>
        </Link>
        <div className="admin-identity">
          <span>{String(access.user.user_metadata?.full_name || access.user.email || "担当者")}</span>
          <small>{organization?.name}・{staffRoleLabels[access.membership.role] || access.membership.role}</small>
        </div>
        <form action="/auth/signout" method="post"><button className="admin-signout">ログアウト</button></form>
        <Link href="/manual/admin" className="admin-signout">管理マニュアル</Link>
      </header>
      <section className="admin-hero">
        <div><p className="eyebrow">COMMAND CENTER</p><h1>災害対応ダッシュボード</h1><p>{organization?.name} / {access.membership.title || staffRoleLabels[access.membership.role]}</p></div>
        <span className="status-chip"><i /> 対応中</span>
      </section>
      <div className="admin-shortcuts">
        <Link href="/admin/staff">担当者と権限を管理 →</Link>
        <span>詳細情報の閲覧・割当・更新は担当者IDと時刻を監査履歴へ記録します。</span>
      </div>
      <AdminDashboard />
    </main>
  );
}
