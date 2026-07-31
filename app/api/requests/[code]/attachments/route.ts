import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/heic", "heic"],
  ["image/heif", "heif"],
]);
const maxBytes = 8 * 1024 * 1024;

function expectedToken(requestId: string) {
  return createHmac("sha256", process.env.INTAKE_HASH_SALT ?? "musubi")
    .update(`attachment:${requestId}`)
    .digest("hex");
}

export async function POST(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const supabase = createAdminClient();
  const { data: target } = await supabase.from("support_requests")
    .select("id").eq("public_code", code.toUpperCase()).maybeSingle();
  if (!target) return NextResponse.json({ error: "受付番号が見つかりません" }, { status: 404 });

  const token = request.headers.get("x-upload-token") ?? "";
  const expected = expectedToken(target.id);
  if (token.length !== expected.length ||
      !timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
    return NextResponse.json({ error: "添付権限を確認できません" }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const files = form?.getAll("photos").filter((item): item is File => item instanceof File) ?? [];
  if (!files.length || files.length > 3) {
    return NextResponse.json({ error: "写真は1回につき1〜3枚選択してください" }, { status: 400 });
  }
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((bucket) => bucket.id === "request-attachments")) {
    const { error: bucketError } = await supabase.storage.createBucket("request-attachments", {
      public: false, fileSizeLimit: maxBytes,
      allowedMimeTypes: Array.from(allowedTypes.keys()),
    });
    if (bucketError && !bucketError.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: "写真保存領域を準備できませんでした" }, { status: 500 });
    }
  }
  const { data: existing } = await supabase.storage.from("request-attachments").list(target.id, { limit: 10 });
  if ((existing?.length ?? 0) + files.length > 3) {
    return NextResponse.json({ error: "写真は1要請につき3枚までです" }, { status: 400 });
  }

  const uploaded: string[] = [];
  for (const file of files) {
    const extension = allowedTypes.get(file.type);
    if (!extension || file.size < 1 || file.size > maxBytes) {
      return NextResponse.json({ error: "JPEG・PNG・WebP・HEIC、1枚8MB以下にしてください" }, { status: 400 });
    }
    const id = randomUUID();
    const path = `${target.id}/${id}.${extension}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: storageError } = await supabase.storage.from("request-attachments")
      .upload(path, bytes, { contentType: file.type, upsert: false });
    if (storageError) {
      return NextResponse.json({ error: "写真を安全に保存できませんでした" }, { status: 500 });
    }
    uploaded.push(id);
  }
  return NextResponse.json({ ok: true, count: uploaded.length }, { status: 201 });
}
