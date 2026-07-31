import Link from "next/link";

export type ManualSection = {
  title: string;
  items: string[];
  warning?: string;
};

export default function ManualPage({
  code,
  title,
  lead,
  sections,
}: {
  code: string;
  title: string;
  lead: string;
  sections: ManualSection[];
}) {
  return (
    <main className="manual-page">
      <header className="about-header">
        <Link href="/" className="about-brand">
          <span className="brand-mark" aria-hidden="true">結</span>
          <span><small>令和8年熊本地震 支援情報システム</small><strong>むすび</strong></span>
        </Link>
        <Link href="/about" className="back-link">← 仕様・使い方へ</Link>
      </header>
      <section className="manual-hero">
        <p className="eyebrow">OPERATION MANUAL / {code}</p>
        <h1>{title}</h1>
        <p>{lead}</p>
        <div className="manual-emergency">
          <strong>命に関わる状況は、システム入力より119・110を優先</strong>
          <span>余震、火災、倒壊、土砂災害の危険がある場所へ単独で近づかないでください。</span>
        </div>
      </section>
      <nav className="manual-nav" aria-label="マニュアル内目次">
        {sections.map((section, index) => (
          <a href={`#manual-${index + 1}`} key={section.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>{section.title}
          </a>
        ))}
      </nav>
      <div className="manual-content">
        {sections.map((section, index) => (
          <section id={`manual-${index + 1}`} key={section.title}>
            <div className="manual-step">{String(index + 1).padStart(2, "0")}</div>
            <div>
              <h2>{section.title}</h2>
              <ol>
                {section.items.map((item) => <li key={item}>{item}</li>)}
              </ol>
              {section.warning && <p className="manual-warning">{section.warning}</p>}
            </div>
          </section>
        ))}
      </div>
      <footer className="about-footer">
        <span>この画面は印刷・共有できます</span>
        <div><button onClick={undefined} className="manual-print">ブラウザの印刷機能を使用</button> <Link href="/">公開マップへ →</Link></div>
      </footer>
    </main>
  );
}
