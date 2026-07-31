"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type TrackedRequest = {
  public_code: string;
  title: string;
  public_area: string;
  category: string;
  status: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

const statusLabel: Record<string, string> = {
  unverified: "内容確認中",
  unassigned: "支援者を調整中",
  assigned: "担当決定",
  in_progress: "対応中",
  completed: "対応完了",
};

export default function MyPage() {
  const [codes, setCodes] = useState<string[]>([]);
  const [requests, setRequests] = useState<TrackedRequest[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("musubi-request-codes") || "[]") as string[];
    setCodes(stored);
    void loadRequests(stored);
  }, []);

  async function loadRequests(targetCodes: string[]) {
    setLoading(true);
    const results = await Promise.all(
      targetCodes.map(async (code) => {
        const response = await fetch(`/api/requests/${encodeURIComponent(code)}`, { cache: "no-store" });
        if (!response.ok) return null;
        const result = await response.json();
        return result.request as TrackedRequest;
      }),
    );
    setRequests(results.filter((item): item is TrackedRequest => item !== null));
    setLoading(false);
  }

  async function addCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = String(form.get("code") || "").trim().toUpperCase();
    const response = await fetch(`/api/requests/${encodeURIComponent(code)}`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "受付番号を確認できませんでした");
      return;
    }
    const nextCodes = Array.from(new Set([code, ...codes]));
    localStorage.setItem("musubi-request-codes", JSON.stringify(nextCodes));
    setCodes(nextCodes);
    setRequests((current) => [result.request, ...current.filter((item) => item.public_code !== code)]);
    setMessage("この端末に受付番号を保存しました");
    event.currentTarget.reset();
  }

  function removeCode(code: string) {
    const nextCodes = codes.filter((item) => item !== code);
    localStorage.setItem("musubi-request-codes", JSON.stringify(nextCodes));
    setCodes(nextCodes);
    setRequests((current) => current.filter((item) => item.public_code !== code));
  }

  return (
    <main className="mypage">
      <header className="about-header">
        <Link href="/" className="about-brand">
          <span className="brand-mark" aria-hidden="true">結</span>
          <span><small>令和8年熊本地震 支援情報システム</small><strong>むすび</strong></span>
        </Link>
        <Link href="/" className="back-link">← 対応状況へ戻る</Link>
      </header>

      <section className="mypage-head">
        <p className="eyebrow">MY REQUESTS</p>
        <h1>マイページ</h1>
        <p>この端末に保存した受付番号から、個人情報を表示せずに支援状況を確認できます。</p>
      </section>

      <section className="mypage-grid">
        <div className="mypage-main">
          <div className="mypage-title">
            <div><p className="eyebrow">TRACKING</p><h2>支援要請の状況</h2></div>
            <button onClick={() => void loadRequests(codes)}>↻ 更新</button>
          </div>
          {loading ? (
            <div className="empty-state">状況を確認しています…</div>
          ) : requests.length ? (
            <div className="tracked-list">
              {requests.map((request) => (
                <article key={request.public_code}>
                  <div className="tracked-top">
                    <span className={`tracking-status ${request.status}`}>{statusLabel[request.status] || request.status}</span>
                    <button onClick={() => removeCode(request.public_code)}>この端末から削除</button>
                  </div>
                  <p className="request-id">{request.public_code}</p>
                  <h3>{request.title}</h3>
                  <p className="location">⌖ {request.public_area}</p>
                  <div className="tracking-steps" aria-label="対応状況">
                    {["unverified", "unassigned", "assigned", "in_progress", "completed"].map((step, index) => {
                      const currentIndex = ["unverified", "unassigned", "assigned", "in_progress", "completed"].indexOf(request.status);
                      return <i key={step} className={index <= currentIndex ? "done" : ""} />;
                    })}
                  </div>
                  <small>個人情報と正確な住所は表示されません</small>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span>受</span>
              <h3>保存された受付番号はありません</h3>
              <p>支援要請を送信すると、この端末へ自動的に保存されます。</p>
              <Link href="/">支援を要請する</Link>
            </div>
          )}
        </div>

        <aside className="mypage-side">
          <p className="eyebrow">ADD REQUEST</p>
          <h2>別の受付番号を追加</h2>
          <p>別の端末で要請した場合は、受付番号を入力してください。</p>
          <form onSubmit={addCode}>
            <label>受付番号<input name="code" required placeholder="KUM-0728-XXXXXX" /></label>
            <button className="primary">状況を確認して保存</button>
          </form>
          {message && <p className="mypage-message" role="status">{message}</p>}
          <div className="volunteer-card">
            <p className="eyebrow">VOLUNTEER</p>
            <h3>登録ボランティアの方</h3>
            <p>担当案件や活動履歴は、運営主体から発行されたアカウントで確認します。</p>
            <button disabled>運営者の認証設定後に利用可能</button>
          </div>
          <div className="device-note">
            <strong>端末内だけに保存</strong>
            <p>受付番号はこのブラウザに保存されます。共有端末では確認後に削除してください。</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
