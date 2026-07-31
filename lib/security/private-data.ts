import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key() {
  const secret = process.env.PRIVATE_DATA_ENCRYPTION_KEY || process.env.INTAKE_HASH_SALT;
  if (!secret) throw new Error("個人情報暗号化キーが未設定です");
  return createHash("sha256").update(secret).digest();
}

export function encryptPrivate(value: string) {
  if (!value) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `enc:v1:${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptPrivate(value: string | null) {
  if (!value || !value.startsWith("enc:v1:")) return value;
  try {
    const [, , iv, tag, encrypted] = value.split(":");
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return "復号できません（管理者へ連絡）";
  }
}
