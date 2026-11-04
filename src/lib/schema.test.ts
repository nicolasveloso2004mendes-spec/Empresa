import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { product, productList } from "./schema";

const data = JSON.parse(readFileSync("data/products.json", "utf8"));

describe("schema de produto", () => {
  it("dados cadastrados são válidos", () => expect(productList.safeParse(data).success).toBe(true));
  it("modelos demonstrativos estão marcados como demo e hotspots não verificados", () => {
    for (const p of data) {
      if (p.model.url.includes("/models/demo-")) {
        expect(p.demo).toBe(true);
        for (const h of p.hotspots) expect(h.verified).toBe(false);
      }
    }
  });
  it("recusa URL de modelo externa", () => {
    expect(product.safeParse({ ...data[0], model: { ...data[0].model, url: "https://x.com/a.glb" } }).success).toBe(false);
  });
  it("recusa path traversal", () => {
    expect(product.safeParse({ ...data[0], model: { ...data[0].model, url: "/models/../../etc.glb" } }).success).toBe(false);
  });
  it("cada produto tem ao menos uma cor disponível ou é exibido como indisponível", () => {
    for (const p of data) expect(p.colors.length).toBeGreaterThan(0);
  });
});
