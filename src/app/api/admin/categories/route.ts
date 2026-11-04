import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { guard } from "@/lib/admin-auth";
import { categoryList } from "@/lib/schema";
import { listCategories, listProducts, saveCategories, StoreError } from "@/lib/store";

export async function GET(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  return NextResponse.json(await listCategories());
}

/** Substitui a lista inteira de categorias. Não permite remover categoria em uso. */
export async function PUT(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  const parsed = categoryList.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.issues }, { status: 400 });
  const products = await listProducts({ includeUnpublished: true });
  const ids = new Set(parsed.data.map((c) => c.id));
  const orphan = products.find((p) => p.category !== "outros" && !ids.has(p.category));
  if (orphan) {
    return NextResponse.json({ error: `A categoria "${orphan.category}" ainda tem produtos (ex.: ${orphan.name}). Mova-os antes de excluir.` }, { status: 409 });
  }
  try {
    const saved = await saveCategories(parsed.data);
    revalidatePath("/", "layout");
    return NextResponse.json(saved);
  } catch (e) {
    if (e instanceof StoreError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
