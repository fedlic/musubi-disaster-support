"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import MapPanel, { SupportPoint } from "./components/MapPanel";
import CivicInfoHub from "./components/CivicInfoHub";

type Filter = "all" | "urgent" | "unassigned" | "x";

const initialPoints: SupportPoint[] = [
  {
    id: "JMA-20260728-1627",
    kind: "official",
    title: "令和8年熊本地震・気象庁発表",
    area: "熊本県熊本地方",
    detail: "2026年7月28日16時27分ごろ、熊本県熊本地方を震源とするマグニチュード7.1の地震が発生しました。最大震度7が観測されています。",
    need: "公式情報",
    people: 0,
    priority: "公式",
    status: "公式発表",
    lat: 32.6,
    lng: 130.7,
    time: "7月28日 16:27",
  },
];

export default function Home() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState("REQ-042");
  const [points, setPoints] = useState(initialPoints);
  const [showRequest, setShowRequest] = useState(false);
  const [notice, setNotice] = useState("");

  const loadPoints = useCallback(async () => {
    try {
      const response = await fetch("/api/requests", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.requests)) return;
      const requestPoints: SupportPoint[] = data.requests.map((item: {
        public_code: string; source: string; title: string; public_area: string;
        public_lat: number; public_lng: number; category: string; people_count: number;
        public_detail: string; priority: string; status: string; created_at: string;
      }) => ({
        id: item.public_code,
        kind: item.source === "x_ai" ? "x" : "request",
        title: item.title,
        area: item.public_area,
        detail: item.public_detail,
        need: item.category,
        people: item.people_count,
        priority: ({ urgent: "緊急", priority: "優先", normal: "通常", unverified: "未確認" } as Record<string, string>)[item.priority] || "未確認",
        status: ({ unverified: "未確認", unassigned: "未割当", assigned: "割当済", in_progress: "対応中", completed: "完了" } as Record<string, string>)[item.status] || item.status,
        lat: item.public_lat,
        lng: item.public_lng,
        time: new Date(item.created_at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      }));
      setPoints([...initialPoints, ...requestPoints]);
      setSelectedId((current) => current === "REQ-042" ? requestPoints[0]?.id || initialPoints[0].id : current);
    } catch {
      setNotice("最新情報を取得できませんでした。時間をおいて更新してください。");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadPoints());
  }, [loadPoints]);

  const visiblePoints = useMemo(
    () =>
      points.filter((point) => {
        if (filter === "urgent") return point.priority === "緊急";
        if (filter === "unassigned") return point.status === "未割当";
        if (filter === "x") return point.kind === "x";
        return true;
      }),
    [filter, points],
  );
  const selected = points.find((point) => point.id === selectedId) ?? points[0];

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const submitButton = event.currentTarget.querySelector<HTMLButtonElement>("button[type=submit]");
    if (submitButton) submitButton.disabled = true;
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area: form.get("area"),
          category: form.get("category"),
          people: Number(form.get("people")),
          summary: form.get("summary"),
          detail: form.get("detail"),
          contact: form.get("contact"),
          website: form.get("website"),
          consent: form.get("consent") === "on",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "送信できませんでした");
      const storedCodes = JSON.parse(localStorage.getItem("musubi-request-codes") || "[]") as string[];
      localStorage.setItem(
        "musubi-request-codes",
        JSON.stringify(Array.from(new Set([result.code, ...storedCodes]))),
      );
      setShowRequest(false);
      setNotice(`支援要請を受け付けました。受付番号: ${result.code}`);
      await loadPoints();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "送信できませんでした");
    } finally {
      if (submitButton) submitButton.disabled = false;
      window.setTimeout(() => setNotice(""), 6500);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">結</span>
          <div>
            <p className="eyebrow">令和8年熊本地震 支援情報システム</p>
            <h1>むすび</h1>
          </div>
        </div>
        <div className="header-actions">
          <span className="status-chip"><i /> 災害対応中</span>
          <Link className="role-button login-link" href="/login">
            <span className="avatar">G</span>
            <span><small>安全な個人認証</small>Googleログイン</span>
          </Link>
          <Link href="/mypage" className="mypage-link">マイページ</Link>
        </div>
      </header>

      <CivicInfoHub />

      <section className="command-bar" aria-label="現在の災害状況">
        <div className="command-title">
          <span className="live-dot" />
          <div><small>熊本県内 災害対応</small><strong>令和8年熊本地震</strong></div>
        </div>
        <div className="metrics">
          <div><span>登録要請</span><strong>{points.filter((point) => point.kind === "request").length}</strong><small>公開範囲</small></div>
          <div><span>公式情報</span><strong>{points.filter((point) => point.kind === "official").length}</strong><small>掲載中</small></div>
          <div><span>未確認情報</span><strong>{points.filter((point) => point.kind === "x").length}</strong><small>要確認</small></div>
          <div className="updated"><span>対象災害</span><strong>最大震度7</strong><small>気象庁発表</small></div>
        </div>
        <button className="primary request-button" onClick={() => setShowRequest(true)}>＋ 支援を要請する</button>
      </section>

      <section className="workspace" id="support-map">
        <aside className="sidebar">
          <div className="section-heading">
            <div><p className="eyebrow">OPERATION FEED</p><h2>対応状況</h2></div>
            <button aria-label="一覧を更新" onClick={() => void loadPoints()}>↻</button>
          </div>
          <div className="filters" role="group" aria-label="要請の絞り込み">
            {[
              ["all", "すべて", points.length],
              ["urgent", "緊急", points.filter((point) => point.priority === "緊急").length],
              ["unassigned", "未割当", points.filter((point) => point.status === "未割当").length],
              ["x", "X 未確認", points.filter((point) => point.kind === "x").length],
            ].map(([value, label, count]) => (
              <button
                key={value}
                className={filter === value ? "active" : ""}
                onClick={() => setFilter(value as Filter)}
              >
                {label}<span>{count}</span>
              </button>
            ))}
          </div>
          <div className="feed">
            {visiblePoints.map((point) => (
              <button
                className={`feed-card ${selected.id === point.id ? "selected" : ""} ${point.kind === "x" ? "x-card" : ""}`}
                key={point.id}
                onClick={() => setSelectedId(point.id)}
              >
                <div className="card-top">
                  <span className={`priority p-${point.priority}`}>{point.priority}</span>
                  <time>{point.time}</time>
                </div>
                <h3>{point.title}</h3>
                <p className="location">⌖ {point.area}</p>
                <div className="card-bottom">
                  <span>{point.need}</span>
                  <b className={`state s-${point.status}`}>{point.status}</b>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className="map-area">
          <MapPanel points={visiblePoints} selectedId={selected.id} onSelect={setSelectedId} />
          <div className="map-legend" aria-label="地図凡例">
            <span><i className="legend-dot official" />公式</span>
            <span><i className="legend-dot urgent" />緊急</span>
            <span><i className="legend-dot priority" />優先</span>
            <span><i className="legend-dot normal" />対応中</span>
            <span><i className="legend-dot unverified" />X 未確認</span>
          </div>
          <button className="mobile-request primary" onClick={() => setShowRequest(true)}>＋ 支援を要請</button>
        </div>

        <aside className="detail-panel">
          <div className="detail-head">
            <span className={`priority p-${selected.priority}`}>{selected.priority}</span>
            <button aria-label="詳細を閉じる">×</button>
          </div>
          <p className="request-id">{selected.id}</p>
          <h2>{selected.title}</h2>
          <p className="location">⌖ {selected.area} <span>公開位置は概略表示</span></p>
          <div className="detail-meta">
            <div><small>必要な支援</small><strong>{selected.need}</strong></div>
            <div><small>対象人数</small><strong>{selected.people || "—"}{selected.people ? "名" : ""}</strong></div>
          </div>
          <div className="detail-copy">
            <h3>状況</h3>
            <p>{selected.detail}</p>
          </div>
          <div className="privacy-note">🔒 個人情報は認可された災害対策担当者だけが管理画面で確認できます</div>
          {selected.kind === "official" && (
            <div className="official-note">
              <strong>公式発表</strong>
              <p>気象庁・熊本県・熊本市の公式情報を確認し、安全確保を最優先にしてください。</p>
              <a href="https://www.jma.go.jp/bosai/map.html#contents=earthquake_map" target="_blank" rel="noreferrer">気象庁の地震情報を見る →</a>
            </div>
          )}
          {selected.kind === "x" && (
            <div className="ai-note">
              <strong>AI収集情報・未確認</strong>
              <p>公開情報から自動抽出した内容です。支援判断の前に現地または公的情報で確認してください。</p>
            </div>
          )}
          <div className="timeline">
            <h3>対応履歴</h3>
            <div><i /><p><strong>要請を受信</strong><small>{selected.time}・自動受付</small></p></div>
            <div><i /><p><strong>内容を一次確認</strong><small>災害対策本部</small></p></div>
          </div>
          <div className="assignment">
            {selected.assignee && <p><span className="avatar small">支</span><span><small>担当</small><strong>{selected.assignee}</strong></span></p>}
            <Link className="primary assignment-link" href={selected.kind === "request" ? "/login?next=/mypage" : "/admin"}>
              {selected.kind === "request" ? "ログインして支援に参加" : "管理者画面で確認"}
            </Link>
          </div>
        </aside>
      </section>

      <footer>
        <span>むすび・令和8年熊本地震</span>
        <p><Link href="/about">仕様・想い・使い方</Link> ・ オープンソースで誰でも利用できます。緊急時は119・110へ。</p>
      </footer>

      {notice && <div className="toast" role="status">✓ {notice}</div>}

      {showRequest && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowRequest(false)}>
          <form className="modal" onSubmit={submitRequest} onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-head"><div><p className="eyebrow">匿名で送信できます</p><h2>支援を要請する</h2></div><button type="button" onClick={() => setShowRequest(false)}>×</button></div>
            <p className="form-intro">命に関わる緊急事態は119へ連絡してください。入力内容は災害対策本部だけが確認します。</p>
            <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <label>場所・目印<input name="area" required placeholder="例：熊本市西区春日、○○公民館付近" /></label>
            <div className="form-row">
              <label>支援の種類<select name="category"><option>飲料水</option><option>食料</option><option>衛生用品</option><option>移動支援</option><option>現地支援</option><option>その他</option></select></label>
              <label>対象人数<input name="people" type="number" min="1" defaultValue="1" /></label>
            </div>
            <label>要請の要約<input name="summary" required placeholder="例：高齢者世帯に飲料水が必要" /></label>
            <label>詳しい状況<textarea name="detail" required rows={3} placeholder="危険箇所、必要な物、移動できるか等" /></label>
            <label>連絡方法（任意・非公開）<input name="contact" placeholder="電話番号または連絡不要" /></label>
            <label className="consent"><input name="consent" type="checkbox" required /> 内容を認可された運営者が確認し、支援調整に利用することに同意します</label>
            <button className="primary submit" type="submit">安全に要請を送信</button>
          </form>
        </div>
      )}

    </main>
  );
}
