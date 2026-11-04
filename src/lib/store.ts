import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { productList, type Product } from "./schema";

/**
 * Armazenamento de produtos em arquivo JSON (data/products.json).
 * Escrita atômica (arquivo temporário + rename) e fila para evitar condições de corrida.
 * Para hospedagem sem disco persistente (ex.: Vercel), troque este módulo por um driver de
 * banco de dados mantendo a mesma interface.
 */
const FILE = process.env.PRODUCTS_FILE || path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "products.json");

let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function readAll(): Promise<Product[]> {
  const raw = await fs.readFile(FILE, "utf8");
  return productList.parse(JSON.parse(raw));
}

async function writeAll(products: Product[]) {
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(products, null, 2) + "\n", "utf8");
  await fs.rename(tmp, FILE);
}

export async function listProducts(opts: { includeUnpublished?: boolean } = {}) {
  const all = await readAll();
  return opts.includeUnpublished ? all : all.filter((p) => p.published);
}

export async function getProductBySlug(slug: string, opts: { includeUnpublished?: boolean } = {}) {
  const all = await listProducts(opts);
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getProductById(id: string) {
  const all = await readAll();
  return all.find((p) => p.id === id) ?? null;
}

export class StoreError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export function saveProduct(input: Product, originalId?: string) {
  return serialize(async () => {
    const all = await readAll();
    const idx = originalId ? all.findIndex((p) => p.id === originalId) : -1;
    if (originalId && idx === -1) throw new StoreError("Produto não encontrado", 404);
    const clash = all.find((p, i) => i !== idx && (p.id === input.id || p.slug === input.slug));
    if (clash) throw new StoreError("Já existe um produto com este identificador ou slug", 409);
    const saved: Product = { ...input, updatedAt: new Date().toISOString() };
    if (idx >= 0) all[idx] = saved;
    else all.push(saved);
    await writeAll(all);
    return saved;
  });
}

export function deleteProduct(id: string) {
  return serialize(async () => {
    const all = await readAll();
    const next = all.filter((p) => p.id !== id);
    if (next.length === all.length) throw new StoreError("Produto não encontrado", 404);
    await writeAll(next);
  });
}
