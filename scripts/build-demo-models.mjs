/**
 * Gera os modelos GLB DEMONSTRATIVOS do showroom (geometria e texturas originais, sem
 * direitos de terceiros). Eles NÃO representam fielmente nenhum aparelho comercial: são
 * arquétipos de formato (linha Pro, padrão, Android ultra, câmera redonda, dobrável) para
 * validar o visualizador até que os arquivos definitivos (licenciados) sejam enviados.
 *
 * Pipeline: three.js (geometria + MeshPhysicalMaterial) → GLTFExporter → glTF-Transform
 * (texturas procedurais WebP, weld, dedup, Draco) → public/models/*.glb
 * Também grava scripts/demo-anchors.json com pontos de referência (para hotspots).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTTextureWebP } from "@gltf-transform/extensions";
import { dedup, weld, draco, prune } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import * as TEX from "./lib/textures.mjs";

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => { this.result = buf; this.onloadend?.({ target: this }); });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buf) => { this.result = `data:${blob.type};base64,${Buffer.from(buf).toString("base64")}`; this.onloadend?.({ target: this }); });
  }
};

const EPS = 0.00004;

/** Retângulo com cantos contínuos (superelipse), como os aparelhos atuais. */
function squircle(w, h, r, n = 4.2, seg = 18, square = {}) {
  const pts = [];
  const corner = (cx, cy, a0) => {
    // canto reto (lado da dobradiça em dobráveis)
    const sx = Math.cos(a0 + Math.PI / 4) > 0 ? "right" : "left";
    if (square[sx]) { pts.push(new THREE.Vector2(cx + Math.sign(Math.cos(a0 + Math.PI / 4)) * r, cy + Math.sign(Math.sin(a0 + Math.PI / 4)) * r)); return; }
    for (let i = 0; i <= seg; i++) {
      const t = a0 + (i / seg) * (Math.PI / 2);
      const c = Math.cos(t), s = Math.sin(t);
      pts.push(new THREE.Vector2(cx + r * Math.sign(c) * Math.abs(c) ** (2 / n), cy + r * Math.sign(s) * Math.abs(s) ** (2 / n)));
    }
  };
  corner(w / 2 - r, h / 2 - r, 0);
  corner(-w / 2 + r, h / 2 - r, Math.PI / 2);
  corner(-w / 2 + r, -h / 2 + r, Math.PI);
  corner(w / 2 - r, -h / 2 + r, (3 * Math.PI) / 2);
  return new THREE.Shape(pts);
}
const circleShape = (r) => { const s = new THREE.Shape(); s.absarc(0, 0, r, 0, Math.PI * 2, false); return s; };

/** UV planar normalizado (0..1) — telas, traseiras. */
function planarUV(geo) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox, pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x || 1);
    uv[i * 2 + 1] = (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y || 1);
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geo;
}
/** UV por projeção na face dominante, em escala métrica (para texturas que repetem). */
function boxUV(geo, k = 45) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.computeVertexNormals();
  const pos = g.attributes.position, nor = g.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i += 3) {
    let nx = 0, ny = 0, nz = 0;
    for (let j = 0; j < 3; j++) { nx += Math.abs(nor.getX(i + j)); ny += Math.abs(nor.getY(i + j)); nz += Math.abs(nor.getZ(i + j)); }
    for (let j = 0; j < 3; j++) {
      const x = pos.getX(i + j), y = pos.getY(i + j), z = pos.getZ(i + j);
      // riscos (ao longo de U) seguem o comprimento de cada lateral
      const [u, v] = nx >= ny && nx >= nz ? [y, z] : ny >= nz ? [x, z] : [x, y];
      uv[(i + j) * 2] = u * k; uv[(i + j) * 2 + 1] = v * k;
    }
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}
function metricUV(geo, k) {
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) { uv[i * 2] = pos.getX(i) * k; uv[i * 2 + 1] = pos.getY(i) * k; }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geo;
}

function materials(spec) {
  const P = (name, params) => { const m = new THREE.MeshPhysicalMaterial(params); m.name = name; return m; };
  const back = spec.back;
  return {
    Frame: P("Frame", { color: spec.frameColor, metalness: 1, roughness: spec.frameRoughness, ...(spec.brushed ? { anisotropy: 0.6 } : {}) }),
    Buttons: P("Buttons", { color: spec.frameColor, metalness: 1, roughness: spec.frameRoughness + 0.06 }),
    AntennaBand: P("AntennaBand", { color: 0x77756f, metalness: 0, roughness: 0.55 }),
    BackGlass: P("BackGlass", back === "leather"
      ? { color: spec.backColor, metalness: 0, roughness: 0.62, sheen: 0.4, sheenRoughness: 0.6, sheenColor: 0xffffff }
      : back === "gloss"
        ? { color: spec.backColor, metalness: 0.05, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.03, ior: 1.52 }
        : { color: spec.backColor, metalness: 0.08, roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.35, ior: 1.52 }),
    CameraPlateau: P("CameraPlateau", { color: spec.plateauColor ?? spec.backColor, metalness: 0.08, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.04, ior: 1.52 }),
    CameraIsland: P("CameraIsland", { color: spec.frameColor, metalness: 1, roughness: 0.22 }),
    FrontGlass: P("FrontGlass", { color: 0x030304, metalness: 0, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02, ior: 1.5 }),
    Screen: P("Screen", { color: 0x000000, emissive: 0x000000, metalness: 0, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02 }),
    InnerScreen: P("InnerScreen", { color: 0x000000, emissive: 0x000000, metalness: 0, roughness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.1 }),
    Island: P("Island", { color: 0x000000, metalness: 0, roughness: 0.25, clearcoat: 1 }),
    LensRing: P("LensRing", { color: 0x9a9aa0, metalness: 1, roughness: 0.32, side: THREE.DoubleSide }),
    LensGlass: P("LensGlass", { color: 0xffffff, metalness: 0, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.0, ior: 1.77 }),
    Flash: P("Flash", { color: 0xffffff, metalness: 0, roughness: 0.35, clearcoat: 1, emissive: 0x0e0b05 }),
    Sensor: P("Sensor", { color: 0x050507, metalness: 0.2, roughness: 0.2, clearcoat: 1 }),
    Port: P("Port", { color: 0x040404, metalness: 0.3, roughness: 0.6 }),
    Hinge: P("Hinge", { color: spec.frameColor, metalness: 1, roughness: 0.3 }),
  };
}

/**
 * Corpo do aparelho (placa). Coordenadas: tela em +Z, traseira em −Z, centro na origem.
 * opts.front: "screen" | "inner" | "none"; opts.back: "glass" | "cover"; opts.cameras etc.
 */
function buildSlab(root, M, spec, o, A) {
  const { W, H, D, R } = o;
  const add = (name, geo, mat, set) => { const m = new THREE.Mesh(geo, mat); m.name = name; set?.(m); root.add(m); return m; };
  const z0 = o.z ?? 0;
  const b = o.round ? D * 0.4 : Math.min(0.0007, D * 0.12); // laterais retas (Pro) ou curvas (Android)
  const sq = o.square ?? {};
  const frameGeo = new THREE.ExtrudeGeometry(squircle(W - 2 * b, H - 2 * b, Math.max(0.001, R - b), 4.2, 18, sq), {
    depth: D - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: o.round ? 8 : 3, curveSegments: 1,
  });
  frameGeo.translate(0, 0, -(D - 2 * b) / 2 + z0);
  add(`${o.p}Frame`, boxUV(frameGeo, 40), M.Frame);

  // faixas de antena
  if (o.antenna !== false) {
    for (const y of [H / 2 - R * 1.4, -H / 2 + R * 1.4]) for (const s of [-1, 1]) {
      add(`${o.p}Antenna_${y > 0 ? "T" : "B"}${s > 0 ? "R" : "L"}`, new THREE.BoxGeometry(0.0004, 0.0011, D * 0.5), M.AntennaBand,
        (m) => m.position.set(s * (W / 2 + 0.00002), y, z0));
    }
  }

  const inset = o.round ? D * 0.3 : 0.0009;
  const zf = z0 + D / 2 + EPS, zb = z0 - D / 2 - EPS;
  // frente
  if (o.front !== "none") {
    add(`${o.p}FrontGlass`, planarUV(new THREE.ShapeGeometry(squircle(W - inset, H - inset, R - inset / 2, 4.2, 18, sq), 1)), M.FrontGlass, (m) => (m.position.z = zf));
    const bz = o.bezel;
    // Tela interna de dobrável: vai até a borda da dobradiça, para as metades formarem uma tela contínua.
    const ext = sq.right ? 1 : sq.left ? -1 : 0;
    const sw = W - inset - bz * 2 + (ext ? inset / 2 + bz : 0);
    const scr = planarUV(new THREE.ShapeGeometry(squircle(sw, H - inset - bz * 2, Math.max(0.001, R - inset / 2 - bz * 0.7), 4.2, 18, sq), 1));
    if (ext) scr.translate(ext * (inset / 2 + bz) / 2, 0, 0);
    if (o.uvSpan) { // tela interna dividida em duas metades: U de cada metade ocupa 0..0,5 ou 0,5..1
      const uv = scr.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, o.uvSpan[0] + uv.getX(i) * (o.uvSpan[1] - o.uvSpan[0]));
    }
    add(`${o.p}Screen`, scr, o.front === "inner" ? M.InnerScreen : M.Screen, (m) => (m.position.z = zf + EPS));
    if (o.notch === "island") {
      add(`${o.p}Island`, new THREE.ShapeGeometry(squircle(0.0125, 0.0037, 0.00185, 2), 1), M.Island,
        (m) => m.position.set(0, H / 2 - inset / 2 - bz - 0.0035, zf + 2 * EPS));
    } else if (o.notch === "punch") {
      add(`${o.p}PunchHole`, new THREE.CircleGeometry(0.0016, 32), M.Island, (m) => m.position.set(o.punchX ?? 0, H / 2 - inset / 2 - bz - 0.0032, zf + 2 * EPS));
    }
    A[`${o.p}screen`] = [0, 0, zf];
  }

  // traseira (vidro/couro) ou tela externa
  const backGeo = new THREE.ShapeGeometry(squircle(W - inset, H - inset, R - inset / 2, 4.2, 18, sq), 1);
  if (o.back === "cover") {
    add(`${o.p}CoverGlass`, backGeo, M.FrontGlass, (m) => { m.rotation.y = Math.PI; m.position.z = zb; });
    const cs = planarUV(new THREE.ShapeGeometry(squircle(W - inset - 0.004, H - inset - 0.004, R - 0.002, 4.2, 18, sq), 1));
    add(`${o.p}CoverScreen`, cs, M.Screen, (m) => { m.rotation.y = Math.PI; m.position.z = zb - EPS; });
    add(`${o.p}CoverPunch`, new THREE.CircleGeometry(0.0015, 32), M.Island, (m) => { m.rotation.y = Math.PI; m.position.set(0, H / 2 - 0.0062, zb - 2 * EPS); });
  } else {
    add(`${o.p}BackGlass`, metricUV(backGeo, spec.back === "leather" ? 22 : 30), M.BackGlass, (m) => { m.rotation.y = Math.PI; m.position.z = zb; });
  }
  A[`${o.p}back`] = [0, 0, zb];
  return { zb, zf, b };
}

/** Conjunto de lente: anel metálico elevado + aro + vidro de safira com textura. */
function addLens(root, M, name, x, y, zb, r, h) {
  const add = (n, geo, mat, set) => { const m = new THREE.Mesh(geo, mat); m.name = n; set?.(m); root.add(m); return m; };
  add(`${name}_Ring`, new THREE.CylinderGeometry(r, r * 1.04, h, 56, 1, true), M.LensRing, (m) => { m.rotation.x = Math.PI / 2; m.position.set(x, y, zb - h / 2); });
  add(`${name}_Lip`, new THREE.RingGeometry(r * 0.82, r, 56), M.LensRing, (m) => { m.rotation.y = Math.PI; m.position.set(x, y, zb - h - EPS); });
  add(`${name}_Glass`, new THREE.CircleGeometry(r * 0.82, 56), M.LensGlass, (m) => { m.rotation.y = Math.PI; m.position.set(x, y, zb - h + 0.00025); });
}
function addFlash(root, M, name, x, y, z, r = 0.0022) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 32), M.Flash); m.name = name; m.rotation.y = Math.PI; m.position.set(x, y, z); root.add(m);
}
function addDot(root, M, name, x, y, z, r = 0.0013) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 24), M.Sensor); m.name = name; m.rotation.y = Math.PI; m.position.set(x, y, z); root.add(m);
}

function addButtons(root, M, o, list) {
  for (const [name, side, y, len] of list) {
    const m = new THREE.Mesh(new RoundedBoxGeometry(0.0011, len, o.D * 0.42, 3, 0.0005), M.Buttons);
    m.name = name; m.position.set(side * (o.W / 2 + 0.00028) + (o.x ?? 0), y, o.z ?? 0); root.add(m);
  }
}
function addBottom(root, M, o, { spen = false, speakers = 6 } = {}) {
  const yb = -o.H / 2 + 0.00022, z = o.z ?? 0;
  const port = new THREE.Mesh(new RoundedBoxGeometry(0.0089, 0.0008, 0.0031, 3, 0.0013), M.Port);
  port.name = "Port"; port.position.set(0, yb, z); root.add(port);
  for (let i = 0; i < speakers; i++) for (const s of [-1, 1]) {
    if (spen && s < 0 && i > 2) continue;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.00045, 0.00045, 0.0006, 12), M.Port);
    m.name = `Speaker_${s}_${i}`; m.position.set(s * (0.0085 + i * 0.0017), yb - 0.0001, z); root.add(m);
  }
  if (spen) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0021, 0.0021, 0.0008, 32), M.Port);
    m.name = "PenSlot"; m.position.set(-o.W / 2 + 0.011, yb - 0.0001, z); root.add(m);
  }
}

// ---------------- Arquétipos ----------------
const ARCH = {
  /** Linha Pro: laterais retas em titânio escovado, vidro fosco, platô quadrado com 3 câmeras. */
  pro(spec) {
    const root = new THREE.Group(); root.name = spec.name; const M = materials(spec); const A = {};
    const o = { p: "", W: 0.0716, H: 0.1476, D: 0.0083, R: 0.0115, bezel: 0.0014, notch: "island" };
    const { zb } = buildSlab(root, M, spec, o, A);
    const size = 0.0355, margin = 0.0045;
    const cx = o.W / 2 - margin - size / 2, cy = o.H / 2 - margin - size / 2;
    const plat = new THREE.ExtrudeGeometry(squircle(size - 0.0012, size - 0.0012, 0.0078), { depth: 0.0004, bevelEnabled: true, bevelThickness: 0.0004, bevelSize: 0.0006, bevelSegments: 4 });
    const pm = new THREE.Mesh(plat, M.CameraPlateau); pm.name = "CameraPlateau"; pm.rotation.y = Math.PI; pm.position.set(cx, cy, zb); root.add(pm);
    const pz = zb - 0.0012;
    const d = size * 0.22, r = 0.0072;
    [[-d, d], [-d, -d], [d, 0]].forEach(([lx, ly], i) => addLens(root, M, `Lens${i}`, cx + lx, cy + ly, pz, r, 0.0016));
    addFlash(root, M, "Flash", cx + d, cy + size * 0.3, pz - EPS);
    addDot(root, M, "Lidar", cx + d, cy - size * 0.3, pz - EPS, 0.0019);
    addButtons(root, M, o, [["Button_Action", -1, o.H / 2 - 0.026, 0.0065], ["Button_VolumeUp", -1, o.H / 2 - 0.040, 0.011], ["Button_VolumeDown", -1, o.H / 2 - 0.054, 0.011], ["Button_Side", 1, o.H / 2 - 0.045, 0.017]]);
    addBottom(root, M, o);
    Object.assign(A, { cameras: [cx, cy, pz - 0.0016], frameRight: [o.W / 2, -0.022, 0], buttonsLeft: [-o.W / 2 - 0.0006, o.H / 2 - 0.033, 0], port: [0, -o.H / 2, 0], backFinish: [-0.012, -0.03, zb], dims: [o.W, o.H, o.D] });
    return { root, A };
  },
  /** Padrão: laterais retas em alumínio, vidro brilhante colorido, 2 câmeras na diagonal. */
  standard(spec) {
    const root = new THREE.Group(); root.name = spec.name; const M = materials(spec); const A = {};
    const o = { p: "", W: 0.0647, H: 0.1316, D: 0.0078, R: 0.0105, bezel: 0.0018, notch: "island" };
    const { zb } = buildSlab(root, M, spec, o, A);
    const size = 0.029, margin = 0.004;
    const cx = o.W / 2 - margin - size / 2, cy = o.H / 2 - margin - size / 2;
    const plat = new THREE.ExtrudeGeometry(squircle(size - 0.001, size - 0.001, 0.0066), { depth: 0.0003, bevelEnabled: true, bevelThickness: 0.0004, bevelSize: 0.0005, bevelSegments: 4 });
    const pm = new THREE.Mesh(plat, M.CameraPlateau); pm.name = "CameraPlateau"; pm.rotation.y = Math.PI; pm.position.set(cx, cy, zb); root.add(pm);
    const pz = zb - 0.0011, d = size * 0.22;
    addLens(root, M, "Lens0", cx - d, cy + d, pz, 0.0066, 0.0014);
    addLens(root, M, "Lens1", cx + d, cy - d, pz, 0.0066, 0.0014);
    addFlash(root, M, "Flash", cx + d, cy + d, pz - EPS, 0.002);
    addDot(root, M, "Mic", cx - d, cy - d, pz - EPS, 0.0006);
    addButtons(root, M, o, [["Button_Action", -1, o.H / 2 - 0.024, 0.006], ["Button_VolumeUp", -1, o.H / 2 - 0.036, 0.01], ["Button_VolumeDown", -1, o.H / 2 - 0.049, 0.01], ["Button_Side", 1, o.H / 2 - 0.041, 0.016]]);
    addBottom(root, M, o);
    Object.assign(A, { cameras: [cx, cy, pz - 0.0014], port: [0, -o.H / 2, 0], dims: [o.W, o.H, o.D] });
    return { root, A };
  },
  /** Android ultra: cantos mais retos, coluna de lentes salientes + periscópio, furo da caneta. */
  ultra(spec) {
    const root = new THREE.Group(); root.name = spec.name; const M = materials(spec); const A = {};
    const o = { p: "", W: 0.0790, H: 0.1625, D: 0.0082, R: 0.0062, bezel: 0.0011, notch: "punch" };
    const { zb } = buildSlab(root, M, spec, o, A);
    const colX = o.W / 2 - 0.0125, top = o.H / 2 - 0.016, r = 0.0068, step = 0.0158;
    for (let i = 0; i < 3; i++) addLens(root, M, `Lens${i}`, colX, top - i * step, zb, r, 0.0013);
    // periscópio: lente quadrada
    const px = colX - 0.0155, py = top - 0.002;
    const ring = new THREE.ExtrudeGeometry(squircle(0.0105, 0.0105, 0.0022), { depth: 0.0009, bevelEnabled: true, bevelThickness: 0.0002, bevelSize: 0.0003, bevelSegments: 3 });
    const rm = new THREE.Mesh(ring, M.LensRing); rm.name = "Periscope_Ring"; rm.rotation.y = Math.PI; rm.position.set(px, py, zb); root.add(rm);
    const g = planarUV(new THREE.ShapeGeometry(squircle(0.0082, 0.0082, 0.0016), 1));
    const gm = new THREE.Mesh(g, M.LensGlass); gm.name = "Periscope_Glass"; gm.rotation.y = Math.PI; gm.position.set(px, py, zb - 0.00125); root.add(gm);
    addFlash(root, M, "Flash", px, top - step * 1.15, zb - EPS, 0.0021);
    addDot(root, M, "Laser", px, top - step * 1.65, zb - EPS, 0.0014);
    addButtons(root, M, o, [["Button_VolumeUp", 1, o.H / 2 - 0.036, 0.013], ["Button_VolumeDown", 1, o.H / 2 - 0.050, 0.013], ["Button_Side", 1, o.H / 2 - 0.066, 0.011]]);
    addBottom(root, M, o, { spen: true });
    Object.assign(A, { cameras: [colX - 0.007, top - step, zb - 0.0013], port: [0, -o.H / 2, 0], pen: [-o.W / 2 + 0.011, -o.H / 2, 0], dims: [o.W, o.H, o.D] });
    return { root, A };
  },
  /** Câmera redonda: laterais curvas, traseira em couro, grande ilha circular com 4 lentes. */
  round(spec) {
    const root = new THREE.Group(); root.name = spec.name; const M = materials(spec); const A = {};
    const o = { p: "", W: 0.0753, H: 0.1612, D: 0.0090, R: 0.0105, bezel: 0.0012, notch: "punch", round: true };
    const { zb } = buildSlab(root, M, spec, o, A);
    const cx = 0, cy = o.H / 2 - 0.034, Rc = 0.0255;
    const isl = new THREE.ExtrudeGeometry(circleShape(Rc - 0.0008), { depth: 0.0012, bevelEnabled: true, bevelThickness: 0.0005, bevelSize: 0.0008, bevelSegments: 6, curveSegments: 96 });
    const im = new THREE.Mesh(isl, M.CameraIsland); im.name = "CameraIsland"; im.rotation.y = Math.PI; im.position.set(cx, cy, zb + 0.0002); root.add(im);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(Rc - 0.0022, 96), M.CameraPlateau); disc.name = "CameraPlateau"; disc.rotation.y = Math.PI; disc.position.set(cx, cy, zb - 0.0019); root.add(disc);
    const pz = zb - 0.0019, d = 0.0105, r = 0.0071;
    [[-d, d], [d, d], [-d, -d], [d, -d]].forEach(([lx, ly], i) => addLens(root, M, `Lens${i}`, cx + lx, cy + ly, pz, i === 0 ? r * 1.08 : r, 0.0010));
    addFlash(root, M, "Flash", cx + Rc + 0.006, cy + 0.006, zb - EPS, 0.0019);
    addDot(root, M, "Sensor", cx + Rc + 0.006, cy - 0.003, zb - EPS, 0.0012);
    addButtons(root, M, o, [["Button_VolumeUp", 1, o.H / 2 - 0.036, 0.014], ["Button_VolumeDown", 1, o.H / 2 - 0.051, 0.014], ["Button_Side", 1, o.H / 2 - 0.068, 0.01]]);
    addBottom(root, M, o);
    Object.assign(A, { cameras: [cx, cy, pz - 0.001], port: [0, -o.H / 2, 0], backFinish: [0, -0.035, zb], dims: [o.W, o.H, o.D] });
    return { root, A };
  },
  /**
   * Dobrável (livro): metade esquerda fixa centrada na origem; a metade direita gira na
   * dobradiça (nó "FoldHinge", eixo Y em x = W/2). Aberto = 0 rad, fechado = −π.
   * A lombada ("FoldSpine") gira metade do ângulo, como dobradiças reais.
   */
  fold(spec) {
    const root = new THREE.Group(); root.name = spec.name; const M = materials(spec); const A = {};
    const W = 0.0675, H = 0.1550, d = 0.0061, R = 0.0085;
    // metade fixa: z ∈ [−d, 0]
    const left = { p: "L_", W, H, D: d, R, bezel: 0.0016, notch: "none", z: -d / 2, front: "inner", uvSpan: [0, 0.5], antenna: false, square: { right: true } };
    const { zb } = buildSlab(root, M, spec, left, A);
    // metade móvel
    const hinge = new THREE.Group(); hinge.name = "FoldHinge"; hinge.position.set(W / 2, 0, 0); root.add(hinge);
    const rightHalf = new THREE.Group(); rightHalf.name = "FoldRightHalf"; rightHalf.position.set(W / 2, 0, 0); hinge.add(rightHalf);
    buildSlab(rightHalf, M, spec, { p: "R_", W, H, D: d, R, bezel: 0.0016, notch: "none", z: -d / 2, front: "inner", uvSpan: [0.5, 1], back: "cover", antenna: false, square: { left: true } }, {});
    // lombada
    const spine = new THREE.Group(); spine.name = "FoldSpine"; spine.position.set(W / 2, 0, 0); root.add(spine);
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(d * 0.97, d * 0.97, H - 0.006, 48, 1, false, Math.PI / 2, Math.PI), M.Hinge);
    sp.name = "Spine"; sp.rotation.y = 0; spine.add(sp);
    // câmeras na traseira da metade fixa (coluna)
    const colX = W / 2 - 0.0135 - 0.004, top = H / 2 - 0.016;
    const bump = new THREE.ExtrudeGeometry(squircle(0.0175, 0.050, 0.0085), { depth: 0.0005, bevelEnabled: true, bevelThickness: 0.0004, bevelSize: 0.0005, bevelSegments: 4 });
    const bm = new THREE.Mesh(bump, M.CameraPlateau); bm.name = "CameraPlateau"; bm.rotation.y = Math.PI; bm.position.set(colX, top - 0.0165, zb); root.add(bm);
    const pz = zb - 0.0013;
    for (let i = 0; i < 3; i++) addLens(root, M, `Lens${i}`, colX, top - i * 0.0155, pz, 0.0064, 0.0012);
    addFlash(root, M, "Flash", colX - 0.014, top - 0.002, zb - EPS, 0.0018);
    addButtons(root, M, { W, D: d, z: -d / 2 }, [["Button_VolumeUp", -1, H / 2 - 0.035, 0.012], ["Button_VolumeDown", -1, H / 2 - 0.049, 0.012], ["Button_Side", -1, H / 2 - 0.066, 0.012]]);
    addBottom(root, M, { W, H, z: -d / 2 }, { speakers: 4 });
    Object.assign(A, { cameras: [colX, top - 0.0155, pz - 0.0012], hinge: [W / 2 + d, 0, 0], innerCrease: [W / 2, 0.01, EPS * 3], cover: [0, 0.01, d + EPS * 3], dims: [W, H, d] });
    return { root, A };
  },
};

const MODELS = [
  { file: "demo-pro.glb", arch: "pro", name: "BBM_Demo_Pro", frameColor: 0x8c8a85, frameRoughness: 0.34, brushed: true, back: "frosted", backColor: 0x9b978f },
  { file: "demo-compact.glb", arch: "standard", name: "BBM_Demo_Compact", frameColor: 0xd5d5d8, frameRoughness: 0.4, brushed: true, back: "gloss", backColor: 0xe4e2de },
  { file: "demo-ultra.glb", arch: "ultra", name: "BBM_Demo_Ultra", frameColor: 0x5b5d61, frameRoughness: 0.3, brushed: true, back: "frosted", backColor: 0x4a4c50 },
  { file: "demo-round.glb", arch: "round", name: "BBM_Demo_Round", frameColor: 0x2b2b2d, frameRoughness: 0.28, brushed: false, back: "leather", backColor: 0x1d1d1f },
  { file: "demo-fold.glb", arch: "fold", name: "BBM_Demo_Fold", frameColor: 0x6b6b70, frameRoughness: 0.3, brushed: true, back: "frosted", backColor: 0x2f3236 },
];

const outDir = join(process.cwd(), "public/models");
mkdirSync(outDir, { recursive: true });
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.encoder": await draco3d.createEncoderModule(),
  "draco3d.decoder": await draco3d.createDecoderModule(),
});

const tex = {
  brushed: await TEX.brushedMetal(), frosted: await TEX.frostedGlass(), leather: await TEX.leather(),
  lens: await TEX.lensColor(), flash: await TEX.flashColor(),
};

const only = process.argv.slice(2);
const anchors = {};
for (const spec of MODELS.filter((m) => !only.length || only.includes(m.arch))) {
  const { root, A } = ARCH[spec.arch](spec);
  anchors[spec.file] = A;
  const scene = new THREE.Scene(); scene.add(root);
  const glb = await new GLTFExporter().parseAsync(scene, { binary: true });
  const doc = await io.readBinary(new Uint8Array(glb));
  doc.createExtension(EXTTextureWebP).setRequired(true);
  const mk = (buf, name) => doc.createTexture(name).setImage(new Uint8Array(buf)).setMimeType("image/webp");
  const cache = new Map();
  const T = (key, part) => { const k = `${key}.${part}`; if (!cache.has(k)) cache.set(k, mk(part ? tex[key][part] : tex[key], k)); return cache.get(k); };
  for (const m of doc.getRoot().listMaterials()) {
    const n = m.getName();
    if ((n === "Frame" || n === "Buttons" || n === "Hinge" || n === "CameraIsland") && spec.brushed) {
      m.setNormalTexture(T("brushed", "normal")).setNormalScale(0.35).setMetallicRoughnessTexture(T("brushed", "roughness"));
    }
    if (n === "BackGlass" && spec.back === "frosted") m.setNormalTexture(T("frosted", "normal")).setNormalScale(0.5).setMetallicRoughnessTexture(T("frosted", "roughness"));
    if (n === "BackGlass" && spec.back === "leather") m.setNormalTexture(T("leather", "normal")).setNormalScale(0.9).setMetallicRoughnessTexture(T("leather", "roughness"));
    if (n === "LensGlass") m.setBaseColorTexture(T("lens"));
    if (n === "Flash") m.setBaseColorTexture(T("flash"));
  }
  const asset = doc.getRoot().getAsset();
  asset.generator = "BBM Imports demo model generator (geometria demonstrativa)";
  asset.copyright = "Modelo demonstrativo original BBM Imports - nao representa aparelho comercial";
  await doc.transform(weld(), dedup(), prune({ keepAttributes: true, keepLeaves: true }), draco({ method: "edgebreaker" }));
  const out = await io.writeBinary(doc);
  writeFileSync(join(outDir, spec.file), out);
  console.log(`[models] ${spec.file}: ${(out.byteLength / 1024).toFixed(1)} KB`);
}
writeFileSync(join(process.cwd(), "scripts/demo-anchors.json"), JSON.stringify(anchors, null, 2));
