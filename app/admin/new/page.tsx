"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function NewAdminRequest() {
  const [notice, setNotice] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/requests", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const data = await response.json();
    if (response.ok) window.location.href = "/admin";
    else setNotice(data.error);
  }
  return <main className="admin-page"><header className="admin-header"><Link href="/admin" className="back-link">← 管理画面</Link><div><p className="eyebrow">NEW REQUEST</p><h1>管理者から案件を登録</h1></div></header>
    <section className="staff-section"><form className="admin-new-form" onSubmit={submit}>
      <label>公開タイトル<input name="title" required /></label><label>公開地域<input name="area" required /></label>
      <label>支援種別<select name="category"><option>飲料水</option><option>食料</option><option>衛生用品</option><option>移動支援</option><option>現地支援</option><option>医療・介護</option><option>その他</option></select></label>
      <label>対象人数<input name="people" type="number" min="0" max="999" defaultValue="1" required /></label>
      <label>緯度<input name="lat" type="number" step="0.000001" defaultValue="32.8031" required /></label><label>経度<input name="lng" type="number" step="0.000001" defaultValue="130.7079" required /></label>
      <label className="wide">状況<textarea name="detail" rows={5} required /></label>
      <button className="primary">確認済み案件として登録</button>{notice && <p className="admin-notice">{notice}</p>}
    </form></section></main>;
}
