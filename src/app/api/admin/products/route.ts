import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { guard } from "@/lib/admin-auth";
import { product } from "@/lib/schema";
import { listProducts, saveProduct, StoreError } from "@/lib/store";

export async function GET(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  return NextResponse.json(await listProducts({ includeUnpublished: true }));
}

export async function POST(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  const parsed = product.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.issues }, { status: 400 });
  try {
    const saved = await saveProduct(parsed.data);
    revalidatePath("/", "layout");
    return NextResponse.json(saved, { status: 201 });
  } catch (e) {
    if (e instanceof StoreError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
