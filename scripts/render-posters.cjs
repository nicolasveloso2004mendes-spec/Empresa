/**
 * Gera as imagens estáticas (catálogo / fallback sem WebGL) renderizando o próprio modelo 3D
 * no showroom. Uso: com o servidor rodando, `node scripts/render-posters.cjs [slug...]`.
 * Saída: public/posters/<id>.webp
 */
const { chromium } = require("playwright");
const sharp = require("sharp");
const fs = require("node:fs");
const path = require("node:path");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const products = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/products.json"), "utf8"));
const only = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1100 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  fs.mkdirSync(path.join(process.cwd(), "public/posters"), { recursive: true });
  for (const p of products.filter((x) => !only.length || only.includes(x.slug))) {
    await page.goto(`${BASE}/showroom/${p.slug}?debug3d`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__bbmViewer && window.__bbmViewer.materials().length > 5, null, { timeout: 30000 });
    await page.addStyleTag({ content: "[data-testid=product-3d-viewer] > :not(div:has(canvas)), .hotspot { display: none !important }" });
    // Ângulo traseiro 3/4: mostra câmeras, acabamento e cor ao mesmo tempo.
    await page.evaluate(() => window.__bbmViewer.setCamera([-1.75, 0.55, -2.85], [0, 0, 0]));
    await page.waitForTimeout(2500);
    const el = page.locator("[data-testid=product-3d-viewer]");
    const png = await el.screenshot();
    const out = path.join(process.cwd(), "public/posters", `${p.id}.webp`);
    const img = sharp(png);
    const { width, height } = await img.metadata();
    const w = Math.min(width, Math.round(height * 0.8));
    await img.extract({ left: Math.round((width - w) / 2), top: 0, width: w, height }).resize({ width: 800 }).webp({ quality: 82 }).toFile(out);
    console.log(`[posters] ${out}`);
  }
  await browser.close();
})();
