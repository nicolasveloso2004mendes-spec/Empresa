// Copia os decoders Draco e o transcoder KTX2 (Basis) do pacote three para /public,
// para que sejam servidos do próprio domínio (sem CDN externa, compatível com a CSP).
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const libs = join(root, "node_modules/three/examples/jsm/libs");
if (!existsSync(libs)) process.exit(0);

const targets = [
  ["draco/gltf", "public/decoders/draco"],
  ["basis", "public/decoders/basis"],
];
for (const [from, to] of targets) {
  mkdirSync(join(root, to), { recursive: true });
  cpSync(join(libs, from), join(root, to), { recursive: true });
}
console.log("[decoders] Draco e Basis copiados para public/decoders");
