import { NextResponse } from "next/server";
import { guard } from "@/lib/admin-auth";
import { storeFile } from "@/lib/files";
import { maxModelBytes, MAX_IMAGE_BYTES, UploadError, validateImage, validateModel } from "@/lib/upload";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;

  const kind = new URL(req.url).searchParams.get("kind");
  const declared = Number(req.headers.get("content-length") || 0);
  const limit = (kind === "image" ? MAX_IMAGE_BYTES : maxModelBytes()) + 64 * 1024;
  if (declared > limit) return NextResponse.json({ error: "Arquivo grande demais." }, { status: 413 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  if (file.size > limit) return NextResponse.json({ error: "Arquivo grande demais." }, { status: 413 });

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (kind === "image") {
      const ext = validateImage(bytes);
      const name = await storeFile(bytes, ext);
      return NextResponse.json({ url: `/api/uploads/${name}` }, { status: 201 });
    }
    const ext = validateModel(file.name, bytes);
    const name = await storeFile(bytes, ext);
    return NextResponse.json({ url: `/api/models/${name}`, bytes: bytes.byteLength }, { status: 201 });
  } catch (e) {
    if (e instanceof UploadError) return NextResponse.json({ error: e.message }, { status: 415 });
    if (e instanceof SyntaxError) return NextResponse.json({ error: "Estrutura do arquivo inválida." }, { status: 415 });
    throw e;
  }
}
