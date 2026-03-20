import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** OAuth state 有效期（与原先 Cookie maxAge 对齐量级） */
const TTL_MS = 30 * 60 * 1000;

/**
 * 使用 SECONDME_CLIENT_SECRET 对 state 做 HMAC，回调时无需依赖 Cookie，
 * 可避免部分浏览器 / 跨站重定向场景下 secondme_oauth_state 未带上导致的 invalid_oauth_state。
 */
export function createSignedOAuthState(): string {
  const secret = process.env.SECONDME_CLIENT_SECRET?.trim();
  if (!secret) {
    throw new Error("Missing SECONDME_CLIENT_SECRET for OAuth state signing");
  }
  const nonce = randomBytes(16).toString("hex");
  const exp = Date.now() + TTL_MS;
  const payload = `${nonce}.${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  const raw = `${payload}.${sig}`;
  return Buffer.from(raw, "utf8").toString("base64url");
}

export function verifySignedOAuthState(state: string): boolean {
  const secret = process.env.SECONDME_CLIENT_SECRET?.trim();
  if (!secret) return false;
  try {
    const raw = Buffer.from(state, "base64url").toString("utf8");
    const parts = raw.split(".");
    if (parts.length !== 3) return false;
    const [nonce, expStr, sig] = parts;
    if (!nonce || !expStr || !sig) return false;
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || Date.now() > exp) return false;
    const payload = `${nonce}.${expStr}`;
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    if (sig.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
