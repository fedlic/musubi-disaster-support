"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Assignment = {
  id: string; assigned_at: string; completed_at: string | null;
  support_requests: { public_code: string; title: string; public_area: string; category: string; people_count: number; public_detail: string; priority: string; status: string } | null;
};

export default function VolunteerPage() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  async function load() {
    const response = await fetch("/api/volunteer/assignments", { cache: "no-store" });
    const data = await response.json();
    if (response.status === 401) { window.location.href = "/login?next=/volunteer"; return; }
    setItems(data.assignments || []);
    setNotice(response.ok ? "" : data.error);
    setLoading(false);
  }
  useEffect(() => { queueMicrotask(() => void load()); }, []);
  async function act(id: string, action: "start" | "complete") {
    const response = await fetch("/api/volunteer/assignments", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignmentId: id, action }),
    });
    const data = await response.json();
    setNotice(response.ok ? "活動状況を更新しました" : data.error);
    if (response.ok) await load();
  }
  return (
    <main className="mypage">
      <header className="about-header"><Link href="/" className="about-brand"><span className="brand-mark">結</span><span><small>登録ボランティア</small><strong>活動ページ</strong></span></Link><Link href="/" className="back-link">← 地図へ戻る</Link></header>
      <section className="mypage-head"><p className="eyebrow">VOLUNTEER OPERATIONS</p><h1>担当案件</h1><p>割り当てられた支援だけを表示します。現地の安全を確認してから活動を開始してください。</p></section>
      <section className="volunteer-assignments">
        {notice && <p className="admin-notice" role="status">{notice}</p>}
        {loading ? <div className="empty-state">担当案件を確認しています…</div> : items.length ? items.map((item) => {
          const request = Array.isArray(item.support_requests) ? item.support_requests[0] : item.support_requests;
          if (!request) return null;
          return <article key={item.id}>
            <div><span className={`priority p-${request.priority}`}>{request.priority}</span><small>{request.public_code}</small></div>
            <h2>{request.title}</h2><p>⌖ {request.public_area}・{request.category}・{request.people_count}名</p>
            <p>{request.public_detail}</p>
            <div className="volunteer-actions">
              <strong>{request.status === "completed" ? "対応完了" : request.status === "in_progress" ? "活動中" : "割当済"}</strong>
              {request.status === "assigned" && <button className="primary" onClick={() => void act(item.id, "start")}>活動を開始</button>}
              {request.status === "in_progress" && <button className="primary" onClick={() => void act(item.id, "complete")}>完了を報告</button>}
            </div>
          </article>;
        }) : <div className="empty-state"><h2>現在の担当案件はありません</h2><p>割当が行われると、ここへ表示されます。</p></div>}
      </section>
    </main>
  );
}
