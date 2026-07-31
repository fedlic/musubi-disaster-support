import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaffAccess, staffRoleLabels } from "@/lib/auth/access";
import { isSupabaseConfigured } from "@/lib/supabase/server";

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
      </header>
      <section className="admin-hero">
        <div><p className="eyebrow">COMMAND CENTER</p><h1>災害対応ダッシュボード</h1><p>{organization?.name} / {access.membership.title || staffRoleLabels[access.membership.role]}</p></div>
        <span className="status-chip"><i /> 対応中</span>
      </section>
      <section className="admin-grid">
        <article className="admin-stat"><small>未確認</small><strong>0</strong><span>本人確認・位置確認が必要</span></article>
        <article className="admin-stat"><small>未割当</small><strong>0</strong><span>担当者の割当待ち</span></article>
        <article className="admin-stat"><small>対応中</small><strong>0</strong><span>現在活動中の案件</span></article>
        <article className="admin-stat"><small>完了</small><strong>0</strong><span>本日の対応完了</span></article>
      </section>
      <section className="admin-panels">
        <article>
          <div className="admin-panel-title"><div><p className="eyebrow">ASSIGNMENTS</p><h2>担当別の対応状況</h2></div><Link href="/admin/staff">担当者管理 →</Link></div>
          <div className="empty-state"><span>担</span><h3>案件データの接続待ち</h3><p>担当者ごとの割当、進行状況、引き継ぎをここで管理します。</p></div>
        </article>
        <aside>
          <p className="eyebrow">SECURITY</p>
          <h2>このログインについて</h2>
          <dl>
            <div><dt>担当者</dt><dd>{String(access.user.user_metadata?.full_name || access.user.email)}</dd></div>
            <div><dt>所属</dt><dd>{organization?.name}</dd></div>
            <div><dt>権限</dt><dd>{staffRoleLabels[access.membership.role] || access.membership.role}</dd></div>
          </dl>
          <p className="security-note">詳細情報の閲覧・割当・更新は、担当者IDと時刻を監査履歴へ記録します。</p>
        </aside>
      </section>
    </main>
  );
}
