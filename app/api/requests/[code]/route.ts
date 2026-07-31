import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    return NextResponse.json({ error: "受付データベースの準備中です" }, { status: 503 });
  }

  const { code } = await context.params;
  if (!/^KUM-\d{4}-[A-Z0-9]{6}$/.test(code)) {
    return NextResponse.json({ error: "受付番号の形式が正しくありません" }, { status: 400 });
  }

  const supabase = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase
    .from("support_requests")
    .select("public_code,title,public_area,category,status,is_verified,created_at,updated_at")
    .eq("public_code", code)
    .maybeSingle();

  if (error) {
    console.error("request lookup failed", error.code);
    return NextResponse.json({ error: "状況を取得できませんでした" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "該当する受付番号が見つかりません" }, { status: 404 });
  }

  return NextResponse.json(
    { request: data },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
