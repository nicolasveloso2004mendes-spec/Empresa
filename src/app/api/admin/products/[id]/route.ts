import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { guard } from "@/lib/admin-auth";
import { product } from "@/lib/schema";
import { deleteProduct, getProductById, saveProduct, StoreError } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const denied = await guard(req);
  if (denied) return denied;
  const p = await getProductById((await params).id);
  return p ? NextResponse.json(p) : NextResponse.json({ error: "Não encontrado" }, { status: 404 });
}

export async function PUT(req: Request, { params }: Ctx) {
  const denied = await guard(req);
  if (denied) return denied;
  const parsed = product.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.issues }, { status: 400 });
  try {
    const saved = await saveProduct(parsed.data, (await params).id);
    revalidatePath("/", "layout");
    return NextResponse.json(saved);
  } catch (e) {
    if (e instanceof StoreError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const denied = await guard(req);
  if (denied) return denied;
  try {
    await deleteProduct((await params).id);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof StoreError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
