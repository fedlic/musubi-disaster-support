"use client";

import { FormEvent, useState } from "react";

type Member = {
  id: string; role: string; title: string | null; is_active: boolean;
  profiles: { display_name: string; email: string | null } | { display_name: string; email: string | null }[] | null;
};
const labels: Record<string, string> = {
  super_admin: "システム管理者", municipal_admin: "自治体管理者", coordinator: "支援調整責任者",
  dispatcher: "配車・割当担当", viewer: "閲覧担当",
};

export default function StaffManager({ initialStaff, canManage }: { initialStaff: Member[]; canManage: boolean }) {
  const [staff, setStaff] = useState(initialStaff);
  const [notice, setNotice] = useState("");
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/staff", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), role: form.get("role"), title: form.get("title") }),
    });
    const data = await response.json();
    setNotice(response.ok ? (data.mailSent ? "招待メールを送信しました。" : "招待を登録しました。メール送信設定を確認してください。") : data.error);
    if (response.ok) event.currentTarget.reset();
  }
  async function update(member: Member, role: string, isActive: boolean) {
    const response = await fetch("/api/admin/staff", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membershipId: member.id, role, isActive }),
    });
    const data = await response.json();
    setNotice(response.ok ? "担当者権限を更新しました" : data.error);
    if (response.ok) setStaff((current) => current.map((item) => item.id === member.id ? { ...item, role, is_active: isActive } : item));
  }
  return (
    <>
      {canManage && (
        <form className="staff-invite" onSubmit={invite}>
          <label>Googleアカウント<input name="email" type="email" required placeholder="name@example.jp" /></label>
          <label>役職名<input name="title" placeholder="例：避難所支援班" /></label>
          <label>権限<select name="role" defaultValue="viewer">{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <button className="primary">招待を登録</button>
        </form>
      )}
      {notice && <p className="admin-notice" role="status">{notice}</p>}
      <div className="staff-table">
        {staff.map((member) => {
          const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
          return (
            <article key={member.id}>
              <span className="avatar">{profile?.display_name?.slice(0, 1) || "担"}</span>
              <div><strong>{profile?.display_name || profile?.email || "担当者"}</strong><small>{member.title || labels[member.role]}</small></div>
              {canManage ? <select value={member.role} onChange={(event) => void update(member, event.target.value, member.is_active)}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : <span>{labels[member.role]}</span>}
              {canManage ? <button className={member.is_active ? "staff-active" : ""} onClick={() => void update(member, member.role, !member.is_active)}>{member.is_active ? "有効" : "停止"}</button> : <b className={member.is_active ? "staff-active" : ""}>{member.is_active ? "有効" : "停止"}</b>}
            </article>
          );
        })}
        {!staff.length && <div className="empty-state">担当者データはまだありません。</div>}
      </div>
    </>
  );
}
