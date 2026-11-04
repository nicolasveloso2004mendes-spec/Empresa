import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { listCategories, listProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([listProducts(), listCategories()]);
  return [
    { url: `${SITE.url}/`, priority: 1 },
    { url: `${SITE.url}/produtos`, priority: 0.8 },
    ...categories.map((c) => ({ url: `${SITE.url}/categorias/${c.slug}`, priority: 0.8 })),
    ...products.flatMap((p) => [
      { url: `${SITE.url}/produtos/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 },
      { url: `${SITE.url}/showroom/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 },
    ]),
  ];
}
