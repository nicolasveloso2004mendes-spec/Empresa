import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { MIME } from "./upload";

/** Uploads ficam FORA de /public, com nome aleatório (UUID), e só são servidos por rota validada. */
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "storage", "uploads");

const NAME = /^[a-f0-9-]{36}\.(glb|gltf|png|jpg|webp)$/;

export async function storeFile(bytes: Uint8Array, ext: string): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${crypto.randomUUID()}.${ext}`;
  await fs.writeFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name), bytes, { mode: 0o640, flag: "wx" });
  return name;
}

export async function serveFile(name: string, allowed: string[]): Promise<Response> {
  const ext = name.split(".").pop() ?? "";
  if (!NAME.test(name) || !allowed.includes(ext)) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": MIME[ext],
        "Content-Length": String(data.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
