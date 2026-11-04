import { beforeEach, describe, expect, it } from "vitest";
import { checkPassword, createSessionToken, verifySessionToken } from "./session";

beforeEach(() => {
  process.env.SESSION_SECRET = "x".repeat(40);
  process.env.ADMIN_PASSWORD = "senha-super-segura";
});

describe("sessão", () => {
  it("token válido é aceito", async () => expect(await verifySessionToken(await createSessionToken())).toBe(true));
  it("token adulterado é recusado", async () => {
    const t = await createSessionToken();
    expect(await verifySessionToken(t.slice(0, -1) + (t.endsWith("a") ? "b" : "a"))).toBe(false);
  });
  it("token expirado é recusado", async () => {
    const t = await createSessionToken(Date.now() - 9 * 3600 * 1000);
    expect(await verifySessionToken(t)).toBe(false);
  });
  it("token de outro segredo é recusado", async () => {
    const t = await createSessionToken();
    process.env.SESSION_SECRET = "y".repeat(40);
    expect(await verifySessionToken(t)).toBe(false);
  });
  it("senha", async () => {
    expect(await checkPassword("senha-super-segura")).toBe(true);
    expect(await checkPassword("senha-super-segur")).toBe(false);
  });
});
