import { serveFile } from "@/lib/files";

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  return serveFile((await params).file, ["png", "jpg", "webp"]);
}
