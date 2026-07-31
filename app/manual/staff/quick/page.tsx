"use client";

import Link from "next/link";

const steps = [
  ["1", "ログイン", "管理画面を開き、登録済みのGoogleアカウントでログインします。共有アカウントは使用しません。"],
  ["2", "未確認を開く", "「未確認」から案件を選び、申告内容・公開地域・連絡先を確認します。必要に応じて電話や現地情報で裏付けます。"],
  ["3", "公開情報を整える", "公開タイトル・地域・説明・地図座標を修正。正確な住所、氏名、電話番号は公開欄へ書きません。"],
  ["4", "優先度を判定", "生命・医療・孤立など即応が必要なら「緊急」、早期対応なら「優先」、それ以外は「通常」にします。"],
  ["5", "担当者を割り当て", "対応状況と担当者を選択して保存します。担当者本人のボランティア画面へ案件が表示されます。"],
  ["6", "進捗・完了を記録", "活動開始後は「対応中」、支援終了後は「完了」に更新。操作は担当者IDと時刻付きで記録されます。"],
];

export default function StaffQuickManual() {
  return (
    <main className="quick-manual">
      <nav className="quick-actions">
        <Link href="/manual/staff">詳細マニュアル</Link>
        <button onClick={() => window.print()}>印刷・PDF保存</button>
      </nav>
      <article className="quick-sheet">
        <header>
          <div><span className="brand-mark">結</span><p>令和8年熊本地震 支援情報システム</p></div>
          <p className="eyebrow">ADMINISTRATIVE STAFF QUICK GUIDE</p>
          <h1>行政担当者向け<br />かんたん操作マニュアル</h1>
          <p>支援要請を「確認 → 優先度判定 → 担当者割当 → 完了」まで処理するための一枚ガイド</p>
        </header>
        <aside className="quick-emergency"><strong>緊急時</strong><span>命に関わる場合は本システム内で処理せず、119・110への通報を案内してください。</span></aside>
        <section>
          <h2>基本の操作</h2>
          <div className="quick-steps">
            {steps.map(([number, title, body]) => <div key={number}><b>{number}</b><h3>{title}</h3><p>{body}</p></div>)}
          </div>
        </section>
        <section>
          <h2>個人情報を守る3つのルール</h2>
          <div className="quick-rules">
            <div><strong>公開しない</strong><p>正確な住所・氏名・電話番号・病歴は公開欄や地図へ記載しない。</p></div>
            <div><strong>必要な人だけ</strong><p>支援調整に必要な担当者だけが閲覧。画面を撮影・転送しない。</p></div>
            <div><strong>確認して残す</strong><p>AI・SNS由来は必ず「未確認」。判断と変更は監査履歴へ残す。</p></div>
          </div>
        </section>
        <section className="quick-help">
          <h2>困ったとき</h2>
          <p><b>担当者・権限：</b>/admin/staff　<b>監査履歴：</b>/admin/audit　<b>詳細：</b>/manual/staff</p>
          <p>障害時は組織で定めた電話・紙台帳等へ切り替え、復旧後に記録を反映してください。</p>
        </section>
        <footer>非公式サービス｜個人情報は認可された災害対応担当者のみ閲覧可｜緊急時 119・110</footer>
      </article>
    </main>
  );
}
