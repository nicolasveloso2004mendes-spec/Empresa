/**
 * Sessão do administrador: token "expiração.assinatura" assinado com HMAC-SHA256
 * (Web Crypto — funciona tanto no runtime Node quanto no proxy).
 */
export const SESSION_COOKIE = "bbm_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 horas

const enc = new TextEncoder();

function secret(): string | null {
  const s = process.env.SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}

export function adminConfigured(): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  return Boolean(secret() && pw && pw.length >= 12);
}

async function hmac(data: string, key: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Comparação em tempo constante para strings de mesmo comprimento esperado. */
export function safeEqual(a: string, b: string): boolean {
  const ab = enc.encode(a), bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) diff |= (ab[i % (ab.length || 1)] ?? 0) ^ (bb[i % (bb.length || 1)] ?? 0);
  return diff === 0 && ab.length === bb.length;
}

export async function createSessionToken(now = Date.now()): Promise<string> {
  const key = secret();
  if (!key) throw new Error("SESSION_SECRET ausente ou curto");
  const exp = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");
  const payload = `${exp}.${nonce}`;
  return `${payload}.${await hmac(payload, key)}`;
}

export async function verifySessionToken(token: string | undefined, now = Date.now()): Promise<boolean> {
  const key = secret();
  if (!key || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [exp, nonce, sig] = parts;
  if (!/^\d+$/.test(exp) || Number(exp) * 1000 < now) return false;
  return safeEqual(await hmac(`${exp}.${nonce}`, key), sig);
}

export async function checkPassword(input: string): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD;
  const key = secret();
  if (!pw || !key) return false;
  // Compara os HMACs (mesmo comprimento) para não vazar o tamanho da senha.
  return safeEqual(await hmac(input, key), await hmac(pw, key));
}
