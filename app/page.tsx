"use client";

import { FormEvent, useMemo, useState } from "react";
import MapPanel, { SupportPoint } from "./components/MapPanel";

type Role = "admin" | "volunteer";
type Filter = "all" | "urgent" | "unassigned" | "x";

const initialPoints: SupportPoint[] = [
  {
    id: "REQ-042",
    kind: "request",
    title: "高齢者世帯・飲料水不足",
    area: "朝日町 3丁目",
    detail: "断水が続いており、歩行が困難な方を含む2世帯で飲料水が不足しています。",
    privateDetail: "代表者: 田中様 / 連絡先: 090-****-1842 / 要介護者1名",
    need: "飲料水",
    people: 4,
    priority: "緊急",
    status: "未割当",
    lat: 35.6818,
    lng: 139.7618,
    time: "8分前",
  },
  {
    id: "REQ-039",
    kind: "request",
    title: "避難所への衛生用品配送",
    area: "緑ヶ丘公民館",
    detail: "乳幼児用おむつと生理用品が不足。施設入口までは軽車両で通行可能です。",
    privateDetail: "現地担当: 佐藤様 / 内線 212 / 乳幼児 7名",
    need: "衛生用品",
    people: 26,
    priority: "優先",
    status: "割当済",
    assignee: "山田 花子",
    lat: 35.6757,
    lng: 139.7479,
    time: "24分前",
  },
  {
    id: "REQ-035",
    kind: "request",
    title: "倒木付近の通行支援",
    area: "河川敷 南側道路",
    detail: "歩行者の迂回誘導と周辺確認が必要です。撤去作業は専門班が対応予定。",
    privateDetail: "通報者: 匿名 / 折返し番号なし",
    need: "現地支援",
    people: 0,
    priority: "通常",
    status: "対応中",
    assignee: "地域支援班B",
    lat: 35.6882,
    lng: 139.746,
    time: "41分前",
  },
  {
    id: "X-018",
    kind: "x",
    title: "駅東口で冠水との投稿",
    area: "中央駅 東口周辺",
    detail: "「駅東口の横断歩道付近で水位が上がっている」とする公開投稿をAIが検知。",
    need: "現地確認",
    people: 0,
    priority: "未確認",
    status: "要確認",
    lat: 35.6709,
    lng: 139.7706,
    time: "12分前",
  },
];

export default function Home() {
  const [role, setRole] = useState<Role>("admin");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState("REQ-042");
  const [points, setPoints] = useState(initialPoints);
  const [showRequest, setShowRequest] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [notice, setNotice] = useState("");

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

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPoint: SupportPoint = {
      id: `REQ-${String(points.length + 43).padStart(3, "0")}`,
      kind: "request",
      title: String(form.get("summary") || "新しい支援要請"),
      area: String(form.get("area") || "位置確認中"),
      detail: String(form.get("detail") || "内容確認中"),
      privateDetail: `連絡方法: ${String(form.get("contact") || "匿名")}`,
      need: String(form.get("category") || "その他"),
      people: Number(form.get("people") || 1),
      priority: "優先",
      status: "未割当",
      lat: 35.68 + Math.random() * 0.012,
      lng: 139.752 + Math.random() * 0.015,
      time: "たった今",
    };
    setPoints((current) => [newPoint, ...current]);
    setSelectedId(newPoint.id);
    setShowRequest(false);
    setNotice("匿名の支援要請を受け付けました。管理者が内容を確認します。");
    window.setTimeout(() => setNotice(""), 4500);
  }

  function assignSelected() {
    setPoints((current) =>
      current.map((point) =>
        point.id === selected.id
          ? { ...point, status: "割当済", assignee: role === "admin" ? "支援チームA" : "あなた" }
          : point,
      ),
    );
    setNotice(role === "admin" ? "支援チームAを割り当てました。" : "この支援に参加しました。");
    window.setTimeout(() => setNotice(""), 3500);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">結</span>
          <div>
            <p className="eyebrow">地域災害支援プラットフォーム</p>
            <h1>むすび</h1>
          </div>
        </div>
        <div className="header-actions">
          <span className="status-chip"><i /> 災害対応中</span>
          <button className="role-button" onClick={() => setShowLogin(true)}>
            <span className="avatar">{role === "admin" ? "管" : "ボ"}</span>
            <span><small>ログイン中</small>{role === "admin" ? "災害対策本部" : "登録ボランティア"}</span>
            <b>⌄</b>
          </button>
        </div>
      </header>

      <section className="command-bar" aria-label="現在の災害状況">
        <div className="command-title">
          <span className="live-dot" />
          <div><small>第2配備体制</small><strong>令和8年 台風12号対応</strong></div>
        </div>
        <div className="metrics">
          <div><span>支援要請</span><strong>12</strong><small>未対応 3</small></div>
          <div><span>活動中</span><strong>8</strong><small>チーム</small></div>
          <div><span>避難所</span><strong>5</strong><small>開設中</small></div>
          <div className="updated"><span>最終更新</span><strong>14:32</strong><small>自動更新</small></div>
        </div>
        <button className="primary request-button" onClick={() => setShowRequest(true)}>＋ 支援を要請する</button>
      </section>

      <section className="workspace">
        <aside className="sidebar">
          <div className="section-heading">
            <div><p className="eyebrow">OPERATION FEED</p><h2>対応状況</h2></div>
            <button aria-label="一覧を更新">↻</button>
          </div>
          <div className="filters" role="group" aria-label="要請の絞り込み">
            {[
              ["all", "すべて", points.length],
              ["urgent", "緊急", 1],
              ["unassigned", "未割当", 1],
              ["x", "X 未確認", 1],
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
          {role === "admin" ? (
            <div className="private-box">
              <div><span>🔒</span><div><small>管理者限定</small><strong>個人情報を含む詳細</strong></div></div>
              <p>{selected.privateDetail || "公開投稿のため個人情報は保存されていません。"}</p>
            </div>
          ) : (
            <div className="privacy-note">🔒 個人情報は災害対策本部のみ閲覧できます</div>
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
            <button className="primary" onClick={assignSelected} disabled={selected.kind === "x"}>
              {selected.kind === "x" ? "確認後に割当可能" : selected.assignee ? "担当を変更" : role === "admin" ? "ボランティアを割り当て" : "この支援に参加"}
            </button>
          </div>
        </aside>
      </section>

      <footer>
        <span>むすび 災害支援情報システム</span>
        <p>公開情報は個人を特定できない粒度に処理されています。緊急時は119・110へ。</p>
      </footer>

      {notice && <div className="toast" role="status">✓ {notice}</div>}

      {showRequest && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowRequest(false)}>
          <form className="modal" onSubmit={submitRequest} onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-head"><div><p className="eyebrow">匿名で送信できます</p><h2>支援を要請する</h2></div><button type="button" onClick={() => setShowRequest(false)}>×</button></div>
            <p className="form-intro">命に関わる緊急事態は119へ連絡してください。入力内容は災害対策本部だけが確認します。</p>
            <label>場所・目印<input name="area" required placeholder="例：朝日町3丁目、青い屋根の家付近" /></label>
            <div className="form-row">
              <label>支援の種類<select name="category"><option>飲料水</option><option>食料</option><option>衛生用品</option><option>移動支援</option><option>現地支援</option><option>その他</option></select></label>
              <label>対象人数<input name="people" type="number" min="1" defaultValue="1" /></label>
            </div>
            <label>要請の要約<input name="summary" required placeholder="例：高齢者世帯に飲料水が必要" /></label>
            <label>詳しい状況<textarea name="detail" required rows={3} placeholder="危険箇所、必要な物、移動できるか等" /></label>
            <label>連絡方法（任意・非公開）<input name="contact" placeholder="電話番号または連絡不要" /></label>
            <label className="consent"><input type="checkbox" required /> 内容を行政担当者が確認し、支援調整に利用することに同意します</label>
            <button className="primary submit" type="submit">安全に要請を送信</button>
          </form>
        </div>
      )}

      {showLogin && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowLogin(false)}>
          <div className="modal login-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-head"><div><p className="eyebrow">DEMO ACCESS</p><h2>表示する役割を選択</h2></div><button onClick={() => setShowLogin(false)}>×</button></div>
            <p className="form-intro">実運用ではSupabase Authと行政発行アカウントで権限を検証します。</p>
            <button className={role === "admin" ? "role-option active" : "role-option"} onClick={() => { setRole("admin"); setShowLogin(false); }}>
              <span className="avatar">管</span><span><strong>災害対策本部</strong><small>個人情報の閲覧・要請の割当</small></span>
            </button>
            <button className={role === "volunteer" ? "role-option active" : "role-option"} onClick={() => { setRole("volunteer"); setShowLogin(false); }}>
              <span className="avatar volunteer">ボ</span><span><strong>登録ボランティア</strong><small>公開情報の閲覧・支援への参加</small></span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
