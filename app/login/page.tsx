import Link from "next/link";
import GoogleLoginButton from "./GoogleLoginButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const requested = (await searchParams).next;
  const nextPath = requested?.startsWith("/") && !requested.startsWith("//")
    ? requested
    : "/mypage";

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="about-brand">
          <span className="brand-mark" aria-hidden="true">結</span>
          <span><small>令和8年熊本地震 支援情報システム</small><strong>むすび</strong></span>
        </Link>
        <div className="auth-copy">
          <p className="eyebrow">SECURE SIGN IN</p>
          <h1>Googleアカウントでログイン</h1>
          <p>個人ごとのアカウントでログインし、担当案件と活動履歴を安全に管理します。</p>
        </div>
        <GoogleLoginButton nextPath={nextPath} />
        <div className="auth-roles">
          <article>
            <span>ボ</span>
            <div><h2>ボランティア</h2><p>登録後、公開案件や自分の担当状況を確認できます。</p></div>
          </article>
          <article>
            <span>管</span>
            <div><h2>行政・運営担当者</h2><p>事前承認された所属と役割に応じて、管理機能が開きます。</p></div>
          </article>
        </div>
        <p className="security-note">Googleログインだけで管理者にはなりません。管理権限は運営組織が担当者ごとに付与し、操作履歴を記録します。</p>
        <div className="auth-links">
          <Link href="/">公開マップへ戻る</Link>
          <Link href="/admin">管理者画面</Link>
        </div>
      </section>
    </main>
  );
}
