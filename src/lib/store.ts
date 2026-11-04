import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { categoryList, productList, type Category, type Product } from "./schema";

/**
 * Armazenamento de produtos em arquivo JSON (data/products.json).
 * Escrita atômica (arquivo temporário + rename) e fila para evitar condições de corrida.
 * Para hospedagem sem disco persistente (ex.: Vercel), troque este módulo por um driver de
 * banco de dados mantendo a mesma interface.
 */
const FILE = process.env.PRODUCTS_FILE || path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "products.json");
const CATEGORIES_FILE = process.env.CATEGORIES_FILE || path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "categories.json");

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

async function atomicWrite(file: string, data: unknown) {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  await fs.rename(tmp, file);
}
const writeAll = (products: Product[]) => atomicWrite(FILE, products);

export async function listCategories(): Promise<Category[]> {
  try {
    const raw = await fs.readFile(CATEGORIES_FILE, "utf8");
    return categoryList.parse(JSON.parse(raw)).sort((a, b) => a.order - b.order);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

export function saveCategories(list: Category[]) {
  return serialize(async () => {
    const ids = new Set<string>(), slugs = new Set<string>();
    for (const c of list) {
      if (ids.has(c.id) || slugs.has(c.slug)) throw new StoreError(`Categoria duplicada: ${c.id}`, 409);
      ids.add(c.id);
      slugs.add(c.slug);
    }
    await atomicWrite(CATEGORIES_FILE, list);
    return list;
  });
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
