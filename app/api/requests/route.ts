import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";

export const runtime = "nodejs";

const allowedCategories = new Set([
  "飲料水",
  "食料",
  "衛生用品",
  "移動支援",
  "現地支援",
  "医療・介護",
  "その他",
]);

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) return null;
  return createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength)
    : "";
}

function publicCode() {
  return `KUM-${new Date().toISOString().slice(5, 10).replace("-", "")}-${randomUUID()
    .slice(0, 6)
    .toUpperCase()}`;
}

export async function GET() {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ requests: [], configured: false });
  }

  const { data, error } = await supabase
    .from("support_requests")
    .select(
      "id,public_code,source,title,public_area,public_lat,public_lng,category,people_count,public_detail,priority,status,is_verified,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("support_requests select failed", error.code);
    return NextResponse.json({ error: "支援要請を取得できませんでした" }, { status: 500 });
  }

  return NextResponse.json(
    { requests: data, configured: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "受付データベースの準備中です。緊急時は119または110へ連絡してください。" },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || body.website) {
    return NextResponse.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  const area = clean(body.area, 120);
  const category = clean(body.category, 30);
  const summary = clean(body.summary, 140);
  const detail = clean(body.detail, 1200);
  const contact = clean(body.contact, 240);
  const people = Number(body.people);
  const consent = body.consent === true;

  if (
    area.length < 2 ||
    summary.length < 3 ||
    detail.length < 5 ||
    !allowedCategories.has(category) ||
    !Number.isInteger(people) ||
    people < 1 ||
    people > 999 ||
    !consent
  ) {
    return NextResponse.json({ error: "必須項目または入力形式を確認してください" }, { status: 400 });
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const requestFingerprint = createHash("sha256")
    .update(`${forwarded}:${request.headers.get("user-agent") ?? ""}:${process.env.INTAKE_HASH_SALT ?? "musubi"}`)
    .digest("hex");

  // Exact coordinates are never accepted from the public form. Administrators
  // geocode and verify the address after intake; the public map starts at a
  // municipality-level point around Kumamoto City.
  const requestId = randomUUID();
  const code = publicCode();
  const { error: publicError } = await supabase.from("support_requests").insert({
    id: requestId,
    public_code: code,
    source: "anonymous",
    title: summary,
    public_area: area,
    public_lat: 32.8031,
    public_lng: 130.7079,
    category,
    people_count: people,
    public_detail: detail,
    priority: "unverified",
    status: "unverified",
    is_verified: false,
  });

  if (publicError) {
    console.error("support_requests insert failed", publicError.code);
    return NextResponse.json({ error: "受付に失敗しました。時間をおいて再度お試しください。" }, { status: 500 });
  }

  const { error: privateError } = await supabase.schema("private").from("request_details").insert({
    request_id: requestId,
    requester_name: null,
    contact_encrypted: contact || null,
    sensitive_notes: `受付端末識別子:${requestFingerprint}`,
    consent_at: new Date().toISOString(),
  });

  if (privateError) {
    await supabase.from("support_requests").delete().eq("id", requestId);
    console.error("private request_details insert failed", privateError.code);
    return NextResponse.json({ error: "個人情報の安全な保存に失敗したため、要請は登録されませんでした。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, code }, { status: 201 });
}
