import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  let inserted = 0;
  let xFound = 0;
  const token = process.env.X_API_BEARER_TOKEN;
  if (token) {
    const query = encodeURIComponent("(熊本 地震 OR 熊本 救援 OR 熊本 断水) -is:retweet lang:ja");
    const response = await fetch(`https://api.x.com/2/tweets/search/recent?query=${query}&max_results=20&tweet.fields=created_at`, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
    });
    if (response.ok) {
      const payload = await response.json() as { data?: { id: string; text: string; created_at?: string }[] };
      xFound = payload.data?.length ?? 0;
      for (const post of payload.data ?? []) {
        const { error } = await admin.from("support_requests").upsert({
          public_code: `X-${post.id}`, source: "x_ai", title: post.text.slice(0, 90),
          public_area: "熊本県内・位置未確認", public_lat: 32.8031, public_lng: 130.7079,
          category: "現地確認", people_count: 0, public_detail: post.text.slice(0, 1200),
          priority: "unverified", status: "unverified", is_verified: false,
          created_at: post.created_at || new Date().toISOString(),
        }, { onConflict: "public_code", ignoreDuplicates: true });
        if (!error) inserted++;
      }
    }
  }

  let officialFound = 0;
  const jmaResponse = await fetch("https://www.jma.go.jp/bosai/quake/data/list.json", { cache: "no-store" });
  if (jmaResponse.ok) {
    const quakes = await jmaResponse.json() as { eid?: string; at?: string; anm?: string; mag?: string; maxi?: string }[];
    const kumamoto = quakes.filter((item) => item.anm?.includes("熊本")).slice(0, 10);
    officialFound = kumamoto.length;
    for (const quake of kumamoto) {
      if (!quake.eid) continue;
      const text = `${quake.at || ""} ${quake.anm || "熊本県周辺"} マグニチュード${quake.mag || "不明"} 最大震度${quake.maxi || "不明"}`;
      const { error } = await admin.from("support_requests").upsert({
        public_code: `JMA-${quake.eid}`, source: "admin", title: `気象庁 地震情報・${quake.anm || "熊本県周辺"}`,
        public_area: quake.anm || "熊本県周辺", public_lat: 32.8031, public_lng: 130.7079,
        category: "公式情報", people_count: 0, public_detail: text,
        priority: "normal", status: "completed", is_verified: true,
        created_at: quake.at || new Date().toISOString(),
      }, { onConflict: "public_code", ignoreDuplicates: true });
      if (!error) inserted++;
    }
  }
  return NextResponse.json({ ok: true, xFound, officialFound, inserted, xConfigured: Boolean(token) });
}
