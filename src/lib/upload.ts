/**
 * Validação de arquivos enviados pelo painel. Nunca confia na extensão nem no
 * Content-Type informados pelo navegador: confere a assinatura binária (magic bytes)
 * e a estrutura do arquivo.
 */
export type ModelKind = "glb" | "gltf";
export type ImageKind = "png" | "jpg" | "webp";

export class UploadError extends Error {}

export function maxModelBytes() {
  const mb = Number(process.env.MAX_MODEL_MB || 25);
  return Math.max(1, Math.min(200, Number.isFinite(mb) ? mb : 25)) * 1024 * 1024;
}
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function validateModel(name: string, bytes: Uint8Array, max = maxModelBytes()): ModelKind {
  if (bytes.byteLength === 0) throw new UploadError("Arquivo vazio.");
  if (bytes.byteLength > max) throw new UploadError(`Arquivo maior que ${Math.round(max / 1024 / 1024)} MB.`);
  const ext = name.toLowerCase().split(".").pop();
  if (ext === "glb") {
    const magic = String.fromCharCode(...bytes.subarray(0, 4));
    if (magic !== "glTF") throw new UploadError("O arquivo não é um GLB válido (assinatura ausente).");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const version = view.getUint32(4, true);
    const length = view.getUint32(8, true);
    if (version !== 2) throw new UploadError("Somente glTF 2.0 é suportado.");
    if (length !== bytes.byteLength) throw new UploadError("GLB corrompido (tamanho declarado não confere).");
    // O primeiro chunk deve ser JSON e precisa ser analisável.
    const jsonLen = view.getUint32(12, true);
    const jsonType = view.getUint32(16, true);
    if (jsonType !== 0x4e4f534a || 20 + jsonLen > bytes.byteLength) throw new UploadError("GLB sem chunk JSON válido.");
    const json = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + jsonLen)));
    assertNoExternalResources(json);
    return "glb";
  }
  if (ext === "gltf") {
    let json: unknown;
    try {
      json = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    } catch {
      throw new UploadError("O arquivo .gltf não é um JSON válido.");
    }
    if (!json || typeof json !== "object" || (json as { asset?: { version?: string } }).asset?.version !== "2.0") {
      throw new UploadError("Somente glTF 2.0 é suportado.");
    }
    assertNoExternalResources(json);
    return "gltf";
  }
  throw new UploadError("Envie um arquivo .glb ou .gltf.");
}

/** Recursos externos (buffers/imagens por URL) não são permitidos: o arquivo deve ser autocontido. */
function assertNoExternalResources(json: unknown) {
  const j = json as { buffers?: { uri?: string }[]; images?: { uri?: string }[] };
  for (const item of [...(j.buffers ?? []), ...(j.images ?? [])]) {
    if (item.uri && !item.uri.startsWith("data:")) {
      throw new UploadError("O arquivo referencia recursos externos. Exporte como GLB ou com recursos embutidos.");
    }
  }
}

export function validateImage(bytes: Uint8Array): ImageKind {
  if (bytes.byteLength === 0) throw new UploadError("Imagem vazia.");
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw new UploadError("Imagem maior que 4 MB.");
  const b = bytes;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (String.fromCharCode(...b.subarray(0, 4)) === "RIFF" && String.fromCharCode(...b.subarray(8, 12)) === "WEBP") return "webp";
  throw new UploadError("Formato de imagem não suportado (use PNG, JPG ou WebP).");
}

export const MIME: Record<string, string> = {
  glb: "model/gltf-binary",
  gltf: "model/gltf+json",
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};
