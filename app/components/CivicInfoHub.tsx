"use client";

import { useState } from "react";

const needs = [
  ["🏫", "避難所", "#shelters"],
  ["🚰", "水・トイレ", "#lifelines"],
  ["💡", "電気・ガス", "#lifelines"],
  ["🏥", "医療・こころ", "#support-map"],
  ["🚚", "支援物資", "#support-map"],
  ["🤝", "ボランティア", "/login?next=/mypage"],
];

export default function CivicInfoHub() {
  const [expanded, setExpanded] = useState(false);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");

  function changeFont(next: "normal" | "large" | "xlarge") {
    setFontSize(next);
    document.documentElement.dataset.fontSize = next;
  }

  async function sharePage() {
    const shareData = {
      title: "むすび｜令和8年熊本地震 支援情報",
      text: "熊本地震の支援・公式情報を確認できます。",
      url: window.location.href,
    };
    if (navigator.share) await navigator.share(shareData).catch(() => undefined);
    else await navigator.clipboard.writeText(window.location.href);
  }

  return (
    <section className="civic-hub" aria-label="緊急連絡と生活情報">
      <div className="emergency-row">
        <div>
          <strong>いのちに関わるとき</strong>
          <span>支援要請フォームではなく、すぐに電話してください</span>
        </div>
        <a href="tel:119"><small>火事・救急・救助</small><b>119</b></a>
        <a href="tel:110"><small>事件・事故</small><b>110</b></a>
        <a href="https://portal.bousai.pref.kumamoto.jp/?l=53-0" target="_blank" rel="noreferrer">
          <small>最も確実な情報</small><b>熊本県 公式</b>
        </a>
      </div>

      <div className="civic-tools">
        <p><i /> 公式情報の最終確認：2026年7月31日 13:00 JST</p>
        <div className="font-controls" role="group" aria-label="文字の大きさ">
          <span>文字</span>
          <button className={fontSize === "normal" ? "active" : ""} onClick={() => changeFont("normal")}>標準</button>
          <button className={fontSize === "large" ? "active" : ""} onClick={() => changeFont("large")}>大</button>
          <button className={fontSize === "xlarge" ? "active" : ""} onClick={() => changeFont("xlarge")}>特大</button>
        </div>
        <button onClick={() => void sharePage()}>共有</button>
        <button onClick={() => window.print()}>印刷</button>
        <button className="hub-toggle" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "生活情報を閉じる" : "生活情報・困りごとを開く"}
        </button>
      </div>

      {expanded && (
        <div className="civic-details">
          <div className="lifeline-summary" id="lifelines">
            <article><span>🚰 水道</span><strong>地域により状況が異なります</strong><a href="https://portal.bousai.pref.kumamoto.jp/?l=53-0" target="_blank" rel="noreferrer">防災情報くまもと →</a></article>
            <article><span>💡 電気</span><strong>停電情報を確認してください</strong><a href="https://customer.kyuden.co.jp/ja/electricity/power-outage.html" target="_blank" rel="noreferrer">九州電力 停電案内 →</a></article>
            <article><span>🚃 交通</span><strong>運休・通行止めに注意</strong><a href="https://www.jartic.or.jp/" target="_blank" rel="noreferrer">道路交通情報 →</a></article>
          </div>
          <div className="need-navigation">
            <h2>困っていることから探す</h2>
            <div>
              {needs.map(([icon, label, href]) => (
                <a href={href} key={label}><span>{icon}</span><strong>{label}</strong></a>
              ))}
            </div>
          </div>
          <div className="rumor-warning">
            <strong>未確認情報を広めないでください</strong>
            <p>SNSの投稿は現地確認または公的機関の情報と照合するまで「未確認」として扱います。送金、身分証の送付、その場での修理契約を求められた場合は応じないでください。</p>
          </div>
        </div>
      )}
    </section>
  );
}
