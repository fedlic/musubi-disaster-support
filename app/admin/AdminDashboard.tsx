"use client";

import { useEffect, useMemo, useState } from "react";

type RequestItem = {
  id: string;
  public_code: string;
  source: string;
  title: string;
  public_area: string;
  category: string;
  people_count: number;
  public_detail: string;
  priority: string;
  status: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};
type PrivateDetail = {
  request_id: string;
  exact_address: string | null;
  requester_name: string | null;
  contact_encrypted: string | null;
  sensitive_notes: string | null;
  consent_at: string;
};
type Staff = {
  user_id: string;
  role: string;
  title: string | null;
  profiles: { display_name: string; email: string | null } | { display_name: string; email: string | null }[] | null;
};
type Assignment = { request_id: string; volunteer_id: string };

const statusLabels: Record<string, string> = {
  unverified: "未確認",
  unassigned: "未割当",
  assigned: "割当済",
  in_progress: "対応中",
  completed: "完了",
};
const priorityLabels: Record<string, string> = {
  unverified: "未判定",
  normal: "通常",
  priority: "優先",
  urgent: "緊急",
};

export default function AdminDashboard() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [details, setDetails] = useState<PrivateDetail[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/requests", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setNotice(data.error || "読み込めませんでした");
      setLoading(false);
      return;
    }
    setRequests(data.requests);
    setDetails(data.privateDetails);
    setStaff(data.staff);
    setAssignments(data.assignments);
    setCanEdit(data.canEdit);
    setSelectedId((current) => current || data.requests[0]?.id || "");
    setLoading(false);
  }

  useEffect(() => {
    queueMicrotask(() => void load());
  }, []);

  const visible = useMemo(() => requests.filter((item) => {
    const matchesSearch = `${item.public_code} ${item.title} ${item.public_area} ${item.category}`
      .toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "unverified") return item.status === "unverified";
    if (filter === "unassigned") return item.status === "unassigned";
    if (filter === "active") return item.status !== "completed";
    if (filter === "completed") return item.status === "completed";
    return true;
  }), [filter, requests, search]);
  const selected = requests.find((item) => item.id === selectedId) ?? visible[0];
  const privateDetail = details.find((item) => item.request_id === selected?.id);
  const assignment = assignments.find((item) => item.request_id === selected?.id);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: selected.id,
        status: form.get("status"),
        priority: form.get("priority"),
        assigneeId: form.get("assignee"),
      }),
    });
    const data = await response.json();
    setNotice(response.ok ? "案件を更新し、監査履歴へ記録しました" : data.error);
    if (response.ok) await load();
  }

  if (loading) return <div className="admin-loading">案件を安全に読み込んでいます…</div>;

  return (
    <section className="case-console">
      <div className="case-toolbar">
        <div>
          <p className="eyebrow">REQUEST OPERATIONS</p>
          <h2>支援要請の確認・割当</h2>
        </div>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="受付番号・地域・内容を検索" />
        <button onClick={() => void load()}>↻ 更新</button>
      </div>
      <div className="case-filters">
        {[
          ["active", "対応中", requests.filter((item) => item.status !== "completed").length],
          ["unverified", "未確認", requests.filter((item) => item.status === "unverified").length],
          ["unassigned", "未割当", requests.filter((item) => item.status === "unassigned").length],
          ["completed", "完了", requests.filter((item) => item.status === "completed").length],
          ["all", "すべて", requests.length],
        ].map(([value, label, count]) => (
          <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(String(value))}>
            {label}<b>{count}</b>
          </button>
        ))}
      </div>
      {notice && <p className="admin-notice" role="status">{notice}</p>}
      <div className="case-layout">
        <div className="case-list">
          {visible.map((item) => (
            <button key={item.id} className={selected?.id === item.id ? "selected" : ""} onClick={() => setSelectedId(item.id)}>
              <div><span className={`priority p-${priorityLabels[item.priority] || "未確認"}`}>{priorityLabels[item.priority] || item.priority}</span><time>{new Date(item.created_at).toLocaleString("ja-JP")}</time></div>
              <strong>{item.title}</strong>
              <small>{item.public_code}・{item.public_area}</small>
              <b>{statusLabels[item.status] || item.status}</b>
            </button>
          ))}
          {!visible.length && <div className="empty-state">該当する支援要請はありません。</div>}
        </div>
        {selected ? (
          <form className="case-detail" onSubmit={save} key={`${selected.id}-${selected.updated_at}`}>
            <div className="case-detail-head"><div><p>{selected.public_code}</p><h2>{selected.title}</h2></div><span>{statusLabels[selected.status]}</span></div>
            <dl>
              <div><dt>公開地域</dt><dd>{selected.public_area}</dd></div>
              <div><dt>支援種別</dt><dd>{selected.category}</dd></div>
              <div><dt>対象人数</dt><dd>{selected.people_count}名</dd></div>
              <div><dt>情報源</dt><dd>{selected.source}</dd></div>
            </dl>
            <section><h3>申告された状況</h3><p>{selected.public_detail}</p></section>
            <section className="case-private">
              <h3>🔒 認可担当者限定</h3>
              <dl>
                <div><dt>氏名</dt><dd>{privateDetail?.requester_name || "未入力"}</dd></div>
                <div><dt>連絡先</dt><dd>{privateDetail?.contact_encrypted || "未入力"}</dd></div>
                <div><dt>正確な住所</dt><dd>{privateDetail?.exact_address || "確認待ち"}</dd></div>
              </dl>
            </section>
            <div className="case-controls">
              <label>優先度<select name="priority" defaultValue={selected.priority} disabled={!canEdit}>
                <option value="unverified">未判定</option><option value="normal">通常</option><option value="priority">優先</option><option value="urgent">緊急</option>
              </select></label>
              <label>対応状況<select name="status" defaultValue={selected.status} disabled={!canEdit}>
                <option value="unverified">未確認</option><option value="unassigned">未割当</option><option value="assigned">割当済</option><option value="in_progress">対応中</option><option value="completed">完了</option>
              </select></label>
              <label>担当者<select name="assignee" defaultValue={assignment?.volunteer_id || ""} disabled={!canEdit}>
                <option value="">未割当</option>
                {staff.map((member) => {
                  const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
                  return <option key={member.user_id} value={member.user_id}>{profile?.display_name || profile?.email || member.user_id}</option>;
                })}
              </select></label>
            </div>
            <button className="primary case-save" disabled={!canEdit}>{canEdit ? "変更を保存して履歴に記録" : "閲覧専用権限"}</button>
          </form>
        ) : <div className="case-detail empty-state">案件を選択してください。</div>}
      </div>
    </section>
  );
}
