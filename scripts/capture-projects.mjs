// Captures real screenshots of each project listed below (desktop viewport,
// desktop long scroll, mobile) into public/projects/<slug>/.
// Usage: npm run capture
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.NODE_PATH + "/playwright")); }
import { mkdirSync } from "node:fs";

const projects = [
  { slug: "wr-car", url: "https://w-rcar-transportes.vercel.app/" },
  { slug: "nicotech", url: "https://nico-tech.vercel.app/" },
];

const browser = await chromium.launch();
for (const p of projects) {
  const dir = `public/projects/${p.slug}`;
  mkdirSync(dir, { recursive: true });

  const desk = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await desk.goto(p.url, { waitUntil: "networkidle", timeout: 60000 });
  // scroll through to trigger lazy content / reveal animations
  await desk.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 250)); }
    window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 800));
  });
  const h = await desk.evaluate(() => Math.min(document.documentElement.scrollHeight, 5400));
  await desk.screenshot({ path: `${dir}/desktop-full.jpg`, type: "jpeg", quality: 78, fullPage: true, clip: { x: 0, y: 0, width: 1440, height: h } });
  const title = await desk.title();
  await desk.close();

  // hero: fresh load, wait for intro animations, no scrolling
  const hero = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await hero.goto(p.url, { waitUntil: "networkidle", timeout: 60000 });
  await hero.waitForTimeout(3500);
  await hero.screenshot({ path: `${dir}/desktop.jpg`, type: "jpeg", quality: 84 });
  await hero.close();

  const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mob.goto(p.url, { waitUntil: "networkidle", timeout: 60000 });
  await mob.waitForTimeout(3500);
  await mob.screenshot({ path: `${dir}/mobile.jpg`, type: "jpeg", quality: 82 });
  // scroll through so scroll-reveal sections are rendered before the long capture
  await mob.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); }
  });
  await mob.evaluate(() => window.scrollTo(0, 0));
  await mob.waitForTimeout(1500);
  const mh = await mob.evaluate(() => Math.min(document.documentElement.scrollHeight, 2048));
  await mob.screenshot({ path: `${dir}/mobile-full.jpg`, type: "jpeg", quality: 78, fullPage: true, clip: { x: 0, y: 0, width: 390, height: mh } });
  await mob.close();
  // GPU-safe textures (max 4096px): see scripts/optimize-textures.sh
  console.log(p.slug, "ok —", title, "— full height", h);
}
await browser.close();
