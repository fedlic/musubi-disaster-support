import Link from "next/link";

export const metadata = {
  title: "仕様・想い・使い方｜むすび",
  description: "令和8年熊本地震 支援情報システム「むすび」の目的、情報設計、利用方法。",
};

export default function AboutPage() {
  return (
    <main className="about-page">
      <header className="about-header">
        <Link href="/" className="about-brand">
          <span className="brand-mark" aria-hidden="true">結</span>
          <span><small>令和8年熊本地震 支援情報システム</small><strong>むすび</strong></span>
        </Link>
        <Link href="/" className="back-link">← 対応状況へ戻る</Link>
      </header>

      <section className="about-hero">
        <p className="eyebrow">PURPOSE &amp; GUIDE</p>
        <h1>必要な支援を、<br />必要な場所へ。</h1>
        <p>
          むすびは、被災した方の声と、行政・災害ボランティアの支援力を安全につなぐための
          情報整理・支援調整ツールです。
        </p>
        <div className="about-alert">
          <strong>命に関わる緊急事態は119・110へ</strong>
          <span>このシステムは消防・警察への緊急通報を代替しません。</span>
        </div>
      </section>

      <section className="about-section">
        <div className="about-number">01</div>
        <div>
          <p className="eyebrow">OUR INTENT</p>
          <h2>この仕組みに込めた想い</h2>
          <p className="about-lead">
            災害時、SNSには大切な声が集まる一方、情報の重複、真偽の判断、個人情報の拡散という課題があります。
            むすびはSNSを置き換えません。散在する声を、行政や支援団体が判断できる形へ整える「共通作戦図」を目指します。
          </p>
          <div className="principle-grid">
            <article><span>守</span><h3>個人情報を守る</h3><p>氏名、連絡先、正確な住所は公開情報と分離し、権限を持つ運営者だけが扱います。</p></article>
            <article><span>確</span><h3>確認状態を伝える</h3><p>匿名要請やSNS由来の情報は、確認されるまで「未確認」と明示します。</p></article>
            <article><span>結</span><h3>支援をつなぐ</h3><p>要請の受付で終わらせず、担当の割当、対応中、完了までを追跡します。</p></article>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-number">02</div>
        <div>
          <p className="eyebrow">HOW TO USE</p>
          <h2>立場ごとの使い方</h2>
          <div className="guide-list">
            <article>
              <div className="guide-role">被災した方・近隣の方</div>
              <ol>
                <li>「支援を要請する」を開き、場所の目印と必要な支援を入力します。</li>
                <li>連絡先は任意です。公開画面には表示されません。</li>
                <li>送信後に表示される受付番号を控えます。</li>
                <li>危険が迫っている場合は、この入力より先に安全確保と119・110への通報を行います。</li>
              </ol>
            </article>
            <article>
              <div className="guide-role">登録ボランティア</div>
              <ol>
                <li>運営主体の本人確認と登録を完了してログインします。</li>
                <li>公開範囲に処理された要請と、活動上の注意事項を確認します。</li>
                <li>運営者から割り当てられた活動だけに参加します。</li>
                <li>単独判断で現地へ向かわず、完了後は結果を報告します。</li>
              </ol>
            </article>
            <article>
              <div className="guide-role">行政・運営者</div>
              <ol>
                <li>匿名要請、公式情報、未確認のSNS情報を別々の情報源として確認します。</li>
                <li>重複、危険度、場所、本人への連絡可否を確認して優先度を決めます。</li>
                <li>安全管理が可能な支援チームへ割り当てます。</li>
                <li>対応履歴を残し、完了後は個人情報の保存期間に従って削除します。</li>
              </ol>
            </article>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-number">03</div>
        <div>
          <p className="eyebrow">SYSTEM DESIGN</p>
          <h2>主な仕様</h2>
          <dl className="spec-list">
            <div><dt>対象災害</dt><dd>令和8年熊本地震</dd></div>
            <div><dt>対応端末</dt><dd>スマートフォン優先、PC・タブレット対応</dd></div>
            <div><dt>利用者</dt><dd>匿名の支援要請者、登録ボランティア、認可された行政・運営者</dd></div>
            <div><dt>地図</dt><dd>公開位置は概略化。正確な位置は権限管理された非公開情報として保存</dd></div>
            <div><dt>情報源</dt><dd>匿名要請、運営者入力、公式発表、AIが抽出した公開SNS情報</dd></div>
            <div><dt>AI情報</dt><dd>自動抽出した情報は必ず「未確認」とし、人の確認前に支援判断へ使用しない</dd></div>
            <div><dt>認証・権限</dt><dd>Supabase Authと行レベルセキュリティで役割ごとの閲覧・操作を制限</dd></div>
            <div><dt>履歴</dt><dd>受付、確認、割当、対応、完了を時刻と担当者付きで記録</dd></div>
          </dl>
        </div>
      </section>

      <section className="about-section">
        <div className="about-number">04</div>
        <div>
          <p className="eyebrow">IMPORTANT</p>
          <h2>運用上の大切な原則</h2>
          <div className="policy-box">
            <p>このシステムは、熊本県・市町村・社会福祉協議会など、正式な運用主体の承認と責任体制のもとで使用することを前提としています。</p>
            <p>現在地、健康状態、連絡先などの個人情報を、公開コメントやSNSへ転載しないでください。</p>
            <p>地震後は余震、倒壊、火災、土砂災害の危険があります。支援者も運営者の安全確認なしに現地へ向かわないでください。</p>
          </div>
          <p className="source-note">
            地震概要は気象庁発表、災害対応状況は熊本県・熊本市の公式発表を参照して更新します。
          </p>
        </div>
      </section>

      <footer className="about-footer">
        <span>むすび・令和8年熊本地震 支援情報システム</span>
        <Link href="/">対応状況を見る →</Link>
      </footer>
    </main>
  );
}
