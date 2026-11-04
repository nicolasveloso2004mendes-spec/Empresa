import { NextResponse } from "next/server";
import { z } from "zod";
import { adminConfigured, checkPassword, createSessionToken, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/session";
import { sameOrigin } from "@/lib/admin-auth";
import { clearRateLimit, rateLimit } from "@/lib/rate-limit";

const body = z.object({ password: z.string().min(1).max(200), website: z.string().max(0).optional() });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  if (!adminConfigured()) {
    return NextResponse.json({ error: "Painel desativado: configure ADMIN_PASSWORD e SESSION_SECRET." }, { status: 503 });
  }
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const limit = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Muitas tentativas. Tente novamente em ${Math.ceil(limit.retryAfter / 60)} min.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }
  const parsed = body.safeParse(await req.json().catch(() => null));
  // "website" é um honeypot: robôs preenchem, pessoas não veem o campo.
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  if (!(await checkPassword(parsed.data.password))) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }
  clearRateLimit(`login:${ip}`);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
