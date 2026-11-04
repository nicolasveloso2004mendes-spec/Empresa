/**
 * Texturas procedurais (sem imagens de terceiros) para os modelos demonstrativos.
 * Todas são geradas pixel a pixel e codificadas em WebP com sharp.
 */
import sharp from "sharp";

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Ruído de valor 2D periódico (para texturas que repetem sem emenda). */
function valueNoise(size, cells, seed) {
  const r = rng(seed);
  const g = Array.from({ length: cells * cells }, () => r());
  const at = (x, y) => g[((y % cells) + cells) % cells * cells + (((x % cells) + cells) % cells)];
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * cells, fy = (y / size) * cells;
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const tx = fx - x0, ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
      out[y * size + x] = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    }
  }
  return out;
}

function fbm(size, base, octaves, seed) {
  const out = new Float32Array(size * size);
  let amp = 1, total = 0;
  for (let o = 0; o < octaves; o++) {
    const n = valueNoise(size, base << o, seed + o * 101);
    for (let i = 0; i < out.length; i++) out[i] += n[i] * amp;
    total += amp;
    amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

/** Converte um mapa de altura em normal map (espaço tangente, periódico). */
function heightToNormal(h, size, strength) {
  const px = new Uint8Array(size * size * 3);
  const at = (x, y) => h[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 3;
      px[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      px[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      px[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
    }
  }
  return px;
}

const encode = (px, size, channels = 3, quality = 90) =>
  sharp(Buffer.from(px.buffer, px.byteOffset, px.byteLength), { raw: { width: size, height: size, channels } })
    .webp({ quality, effort: 6 })
    .toBuffer();

/** Metal escovado: riscos finos ao longo de U. Retorna { normal, roughness }. */
export async function brushedMetal(size = 512, seed = 7) {
  const r = rng(seed);
  const rows = new Float32Array(size);
  for (let y = 0; y < size; y++) rows[y] = r();
  // suaviza levemente entre linhas vizinhas e adiciona variação longa ao longo de U
  const long = fbm(size, 4, 3, seed + 3);
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const v = (rows[y] * 0.6 + rows[(y + 1) % size] * 0.25 + rows[(y + size - 1) % size] * 0.15);
    for (let x = 0; x < size; x++) h[y * size + x] = v + long[y * size + x] * 0.15;
  }
  const normal = heightToNormal(h, size, 1.6);
  const mr = new Uint8Array(size * size * 3);
  for (let i = 0; i < size * size; i++) {
    mr[i * 3] = 255;
    mr[i * 3 + 1] = Math.round((0.82 + h[i] * 0.18) * 255); // rugosidade (multiplica o fator)
    mr[i * 3 + 2] = 255; // metalicidade
  }
  return { normal: await encode(normal, size), roughness: await encode(mr, size) };
}

/** Vidro jateado (fosco): micro-relevo muito fino. */
export async function frostedGlass(size = 512, seed = 11) {
  const h = fbm(size, 64, 3, seed);
  const normal = heightToNormal(h, size, 0.9);
  const mr = new Uint8Array(size * size * 3);
  for (let i = 0; i < size * size; i++) {
    mr[i * 3] = 255;
    mr[i * 3 + 1] = Math.round((0.85 + h[i] * 0.15) * 255);
    mr[i * 3 + 2] = 255;
  }
  return { normal: await encode(normal, size), roughness: await encode(mr, size) };
}

/** Couro sintético granulado: células (Voronoi) + ruído fino. */
export async function leather(size = 512, seed = 23) {
  const r = rng(seed);
  const cells = 26;
  const pts = Array.from({ length: cells * cells }, (_, i) => [((i % cells) + r()) / cells, (Math.floor(i / cells) + r()) / cells]);
  const fine = fbm(size, 48, 2, seed + 5);
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const cx = Math.floor(u * cells), cy = Math.floor(v * cells);
      let d1 = 9, d2 = 9;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const gx = (cx + ox + cells) % cells, gy = (cy + oy + cells) % cells;
          const p = pts[gy * cells + gx];
          let dx = p[0] - u, dy = p[1] - v;
          dx -= Math.round(dx); dy -= Math.round(dy);
          const d = Math.hypot(dx, dy);
          if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
        }
      }
      const edge = Math.min(1, (d2 - d1) * cells * 2.2); // 0 nas fendas, 1 no centro do grão
      const dome = Math.max(0, 1 - (d1 * cells * 1.05) ** 2); // grão arredondado
      h[y * size + x] = dome * 0.45 + Math.pow(edge, 0.35) * 0.4 + fine[y * size + x] * 0.15;
    }
  }
  const normal = heightToNormal(h, size, 2.2);
  const mr = new Uint8Array(size * size * 3);
  for (let i = 0; i < size * size; i++) {
    mr[i * 3] = 255;
    mr[i * 3 + 1] = Math.round((1 - h[i] * 0.25) * 255); // fendas mais ásperas
    mr[i * 3 + 2] = 0;
  }
  return { normal: await encode(normal, size), roughness: await encode(mr, size) };
}

/** Cor da lente: elementos internos, anéis, revestimento antirreflexo e reflexo de estúdio. */
export async function lensColor(size = 256) {
  const px = new Uint8Array(size * size * 3);
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size - 0.5, v = y / size - 0.5;
      const rr = Math.hypot(u, v) * 2; // 0 centro, 1 borda
      const ang = Math.atan2(v, u);
      let c = [8, 9, 13];
      if (rr < 0.14) c = [2, 3, 6];
      else if (rr < 0.38) {
        // elemento interno: anel de revestimento roxo → verde-azulado
        const band = Math.max(0, 1 - Math.abs(rr - 0.26) * 9);
        const hue = Math.sin(ang * 1.5 + 0.8) * 0.5 + 0.5;
        c = mix([10, 11, 20], mix([96, 52, 170], [40, 150, 140], hue), band);
      } else if (rr < 0.42) c = [70, 72, 80];
      else if (rr < 0.64) {
        const band = Math.max(0, 1 - Math.abs(rr - 0.53) * 8);
        const t = Math.max(0, Math.cos(ang - 2.2));
        c = mix([12, 14, 18], [30, 120, 95], band * t * 0.9);
      } else if (rr < 0.69) c = [58, 59, 66];
      else if (rr <= 1.01) c = [12, 12, 15];
      // reflexo de softbox (crescente) — dá leitura de vidro curvo mesmo em ambiente escuro
      const hx = u + 0.14, hy = v + 0.17;
      const crescent = Math.max(0, 1 - Math.abs(Math.hypot(hx, hy) * 2 - 0.5) * 14) * Math.max(0, Math.cos(Math.atan2(hy, hx) + 2.3));
      c = mix(c, [210, 215, 225], Math.min(1, crescent * 0.55));
      const i = (y * size + x) * 3;
      px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
    }
  }
  return encode(px, size, 3, 92);
}

/** Flash: difusor quente com microlentes. */
export async function flashColor(size = 128) {
  const px = new Uint8Array(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = (x % 12) - 6, cy = (y % 12) - 6;
      const dot = Math.max(0, 1 - Math.hypot(cx, cy) / 5.5);
      const i = (y * size + x) * 3;
      px[i] = 226 + 25 * dot; px[i + 1] = 214 + 20 * dot; px[i + 2] = 178 + 10 * dot;
    }
  }
  return encode(px, size, 3, 90);
}
