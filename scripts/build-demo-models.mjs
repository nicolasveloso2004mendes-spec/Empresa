/**
 * Gera os modelos GLB DEMONSTRATIVOS do showroom.
 *
 * IMPORTANTE: estes modelos são geometria original criada por código (sem direitos de
 * terceiros). Eles NÃO representam fielmente nenhum iPhone ou outro aparelho comercial —
 * servem para validar o visualizador até que os arquivos definitivos (licenciados) sejam
 * enviados pelo painel administrativo.
 *
 * Pipeline: three.js (geometria) -> GLTFExporter (GLB) -> glTF-Transform (weld, dedup,
 * compressão Draco) -> public/models/*.glb
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, weld, draco, prune } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";

// GLTFExporter usa FileReader no modo binário; polyfill mínimo para Node.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      this.onloadend?.({ target: this });
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = `data:${blob.type};base64,${Buffer.from(buf).toString("base64")}`;
      this.onloadend?.({ target: this });
    });
  }
};

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

const mat = (name, params) => {
  const m = new THREE.MeshStandardMaterial(params);
  m.name = name;
  return m;
};

function buildPhone(spec) {
  const { W, H, D, R, lenses } = spec;
  const root = new THREE.Group();
  root.name = spec.name;

  const M = {
    Frame: mat("Frame", { color: spec.frameColor, metalness: 1, roughness: spec.frameRoughness }),
    Buttons: mat("Buttons", { color: spec.frameColor, metalness: 1, roughness: spec.frameRoughness + 0.05 }),
    BackGlass: mat("BackGlass", { color: spec.backColor, metalness: 0.1, roughness: spec.backRoughness }),
    CameraPlateau: mat("CameraPlateau", { color: spec.backColor, metalness: 0.15, roughness: 0.12 }),
    FrontGlass: mat("FrontGlass", { color: 0x050506, metalness: 0.2, roughness: 0.05 }),
    Screen: mat("Screen", { color: 0x0a0a0c, emissive: 0x000000, metalness: 0, roughness: 0.08 }),
    Island: mat("Island", { color: 0x000000, metalness: 0, roughness: 0.3 }),
    LensRing: mat("LensRing", { color: 0x6f6f72, metalness: 1, roughness: 0.22, side: THREE.DoubleSide }),
    LensGlass: mat("LensGlass", { color: 0x1c2030, metalness: 0.1, roughness: 0.12 }),
    LensCoating: mat("LensCoating", { color: 0x55479c, metalness: 0.25, roughness: 0.3 }),
    LensInner: mat("LensInner", { color: 0x0e1424, metalness: 0.2, roughness: 0.08 }),
    Flash: mat("Flash", { color: 0xf3ead2, metalness: 0, roughness: 0.4, emissive: 0x15120a }),
    Port: mat("Port", { color: 0x050505, metalness: 0.2, roughness: 0.7 }),
    AntennaBand: mat("AntennaBand", { color: 0x8a8a8a, metalness: 0, roughness: 0.6 }),
  };

  const add = (name, geo, material, setup) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = name;
    setup?.(mesh);
    root.add(mesh);
    return mesh;
  };

  // Estrutura lateral (moldura) — extrusão com chanfro arredondado.
  const bevel = D * 0.28;
  const frameGeo = new THREE.ExtrudeGeometry(roundedRect(W - 2 * bevel, H - 2 * bevel, R - bevel), {
    depth: D - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 6, curveSegments: 24,
  });
  frameGeo.translate(0, 0, -(D - 2 * bevel) / 2);
  add("Frame", frameGeo, M.Frame);

  // Faixas de antena (detalhe da estrutura).
  for (const y of [H / 2 - R * 1.6, -H / 2 + R * 1.6]) {
    for (const side of [-1, 1]) {
      add(`Antenna_${y > 0 ? "T" : "B"}${side > 0 ? "R" : "L"}`,
        new THREE.BoxGeometry(0.0006, 0.0012, D * 0.55), M.AntennaBand,
        (m) => m.position.set(side * (W / 2 + 0.00005), y, 0));
    }
  }

  // Vidro frontal, tela e ilha.
  const zFront = D / 2 + 0.00005;
  add("FrontGlass", new THREE.ShapeGeometry(roundedRect(W - D * 0.36, H - D * 0.36, R - D * 0.18), 24), M.FrontGlass,
    (m) => (m.position.z = zFront));
  const bezel = spec.bezel;
  const screenGeo = new THREE.ShapeGeometry(roundedRect(W - D * 0.36 - bezel * 2, H - D * 0.36 - bezel * 2, R - D * 0.18 - bezel * 0.6), 24);
  // UV normalizados para receber o "wallpaper" gerado no cliente.
  {
    const pos = screenGeo.attributes.position, uv = screenGeo.attributes.uv;
    screenGeo.computeBoundingBox();
    const bb = screenGeo.boundingBox;
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
    }
  }
  add("Screen", screenGeo, M.Screen, (m) => (m.position.z = zFront + 0.00004));
  add("Island", new THREE.ShapeGeometry(roundedRect(spec.islandW, 0.0037, 0.00185), 16), M.Island,
    (m) => m.position.set(0, H / 2 - D * 0.18 - bezel - 0.0035, zFront + 0.00008));

  // Traseira.
  const zBack = -D / 2 - 0.00005;
  add("BackGlass", new THREE.ShapeGeometry(roundedRect(W - D * 0.36, H - D * 0.36, R - D * 0.18), 24), M.BackGlass,
    (m) => { m.rotation.y = Math.PI; m.position.z = zBack; });

  // Módulo de câmeras (canto superior esquerdo visto por trás = +X no espaço do modelo).
  const cam = spec.camera;
  const plateauH = 0.0012;
  const plateau = new THREE.ExtrudeGeometry(roundedRect(cam.size, cam.size, cam.radius), {
    depth: plateauH * 0.4, bevelEnabled: true, bevelThickness: plateauH * 0.3, bevelSize: 0.0009, bevelSegments: 4, curveSegments: 20,
  });
  const camX = W / 2 - cam.margin - cam.size / 2;
  const camY = H / 2 - cam.margin - cam.size / 2;
  add("CameraPlateau", plateau, M.CameraPlateau, (m) => {
    m.rotation.y = Math.PI;
    m.position.set(camX, camY, zBack - 0.00002);
  });
  const lensZ = zBack - plateauH;
  for (const [i, [lx, ly]] of lenses.entries()) {
    const x = camX + lx, y = camY + ly;
    const h = 0.0016; // altura do anel da lente acima do platô
    // Anel metálico (tubo aberto) + aro superior.
    add(`LensRing_${i}`, new THREE.CylinderGeometry(cam.lensR, cam.lensR * 1.03, h, 48, 1, true), M.LensRing,
      (m) => { m.rotation.x = Math.PI / 2; m.position.set(x, y, lensZ - h / 2); });
    add(`LensLip_${i}`, new THREE.RingGeometry(cam.lensR * 0.8, cam.lensR, 48), M.LensRing,
      (m) => { m.rotation.y = Math.PI; m.position.set(x, y, lensZ - h - 0.00002); });
    // Vidro levemente rebaixado, com tratamento antirreflexo e elemento interno.
    add(`LensGlass_${i}`, new THREE.CircleGeometry(cam.lensR * 0.8, 48), M.LensGlass,
      (m) => { m.rotation.y = Math.PI; m.position.set(x, y, lensZ - h + 0.0003); });
    add(`LensCoating_${i}`, new THREE.RingGeometry(cam.lensR * 0.36, cam.lensR * 0.5, 40), M.LensCoating,
      (m) => { m.rotation.y = Math.PI; m.position.set(x, y, lensZ - h + 0.00028); });
    add(`LensInner_${i}`, new THREE.CircleGeometry(cam.lensR * 0.3, 32), M.LensInner,
      (m) => { m.rotation.y = Math.PI; m.position.set(x, y, lensZ - h + 0.00027); });
  }
  const [fx, fy] = spec.flash;
  add("Flash", new THREE.CircleGeometry(0.0022, 24), M.Flash,
    (m) => { m.rotation.y = Math.PI; m.position.set(camX + fx, camY + fy, zBack - plateauH - 0.00003); });

  // Botões laterais (cápsulas arredondadas).
  const btn = (name, side, y, len) =>
    add(name, new RoundedBoxGeometry(0.0012, len, D * 0.42, 3, 0.0005), M.Buttons,
      (m) => m.position.set(side * (W / 2 + 0.0003), y, 0));
  btn("Button_Action", -1, H / 2 - 0.026, 0.0065);
  btn("Button_VolumeUp", -1, H / 2 - 0.040, 0.0110);
  btn("Button_VolumeDown", -1, H / 2 - 0.054, 0.0110);
  btn("Button_Side", 1, H / 2 - 0.045, 0.0170);

  // Conector inferior e furos de alto-falante.
  add("Port", new RoundedBoxGeometry(0.0089, 0.0008, 0.0030, 3, 0.0013), M.Port,
    (m) => m.position.set(0, -H / 2 + 0.00025, 0));
  for (let i = 0; i < 6; i++) {
    for (const side of [-1, 1]) {
      add(`Speaker_${side}_${i}`, new THREE.CylinderGeometry(0.00045, 0.00045, 0.0006, 12), M.Port,
        (m) => m.position.set(side * (0.0085 + i * 0.0017), -H / 2 + 0.0001, 0));
    }
  }
  return root;
}

const camTriple = (s) => [[-s * 0.22, s * 0.22], [-s * 0.22, -s * 0.22], [s * 0.22, 0]];
const MODELS = [
  {
    file: "demo-pro.glb",
    name: "BBM_Demo_Pro",
    W: 0.0716, H: 0.1476, D: 0.0083, R: 0.0115, bezel: 0.0014, islandW: 0.0125,
    frameColor: 0x8c8a85, frameRoughness: 0.32, backColor: 0x9b978f, backRoughness: 0.42,
    camera: { size: 0.0355, radius: 0.0085, margin: 0.0045, lensR: 0.0072 },
    lenses: camTriple(0.0355), flash: [0.0355 * 0.22, 0.0355 * 0.3],
  },
  {
    file: "demo-compact.glb",
    name: "BBM_Demo_Compact",
    W: 0.0647, H: 0.1316, D: 0.0078, R: 0.0105, bezel: 0.0018, islandW: 0.0115,
    frameColor: 0xd5d5d8, frameRoughness: 0.42, backColor: 0xe4e2de, backRoughness: 0.12,
    camera: { size: 0.0290, radius: 0.0070, margin: 0.0040, lensR: 0.0066 },
    lenses: [[-0.0290 * 0.22, 0.0290 * 0.22], [0.0290 * 0.22, -0.0290 * 0.22]], flash: [0.0290 * 0.24, 0.0290 * 0.24],
  },
];

const outDir = join(process.cwd(), "public/models");
mkdirSync(outDir, { recursive: true });

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.encoder": await draco3d.createEncoderModule(),
  "draco3d.decoder": await draco3d.createDecoderModule(),
});

for (const spec of MODELS) {
  const scene = new THREE.Scene();
  scene.add(buildPhone(spec));
  const glb = await new GLTFExporter().parseAsync(scene, { binary: true });
  const doc = await io.readBinary(new Uint8Array(glb));
  doc.getRoot().getAsset().generator = "BBM Imports demo model generator (geometria demonstrativa)";
  doc.getRoot().getAsset().copyright = "Modelo demonstrativo original BBM Imports - nao representa aparelho comercial";
  await doc.transform(weld(), dedup(), prune({ keepAttributes: true }), draco({ method: "edgebreaker" }));
  const out = await io.writeBinary(doc);
  writeFileSync(join(outDir, spec.file), out);
  console.log(`[models] ${spec.file}: ${(out.byteLength / 1024).toFixed(1)} KB (bruto ${(glb.byteLength / 1024).toFixed(1)} KB)`);
}
