"use client";
import { CanvasTexture, SRGBColorSpace } from "three";

const cache = new Map<string, CanvasTexture>();

/** Wallpaper gerado no navegador para a tela do aparelho (sem imagens de terceiros). */
export function getScreenTexture(label: string, demo: boolean): CanvasTexture {
  const key = `${label}|${demo}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const w = 512, h = 1056;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#0d0c0b");
  bg.addColorStop(0.55, "#1d1914");
  bg.addColorStop(1, "#060606");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  // Ondas de luz champanhe.
  for (let i = 0; i < 5; i++) {
    const g = ctx.createRadialGradient(w * (0.2 + i * 0.17), h * (0.45 + Math.sin(i) * 0.18), 10, w * 0.5, h * 0.5, w * 0.9);
    g.addColorStop(0, `rgba(214,190,146,${0.2 - i * 0.03})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.fillStyle = "rgba(244,238,228,0.92)";
  ctx.textAlign = "center";
  ctx.font = "300 46px system-ui, sans-serif";
  ctx.fillText("BBM", w / 2, h * 0.2);
  ctx.font = "500 15px system-ui, sans-serif";
  ctx.fillStyle = "rgba(244,238,228,0.55)";
  ctx.fillText("I M P O R T S", w / 2, h * 0.2 + 34);
  if (demo) {
    ctx.font = "600 17px system-ui, sans-serif";
    ctx.fillStyle = "rgba(214,190,146,0.9)";
    ctx.fillText("MODELO DEMONSTRATIVO", w / 2, h * 0.9);
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  tex.flipY = true;
  cache.set(key, tex);
  return tex;
}
