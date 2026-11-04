/**
 * Testes de aceitação do showroom 3D (Playwright + Chromium com WebGL via SwiftShader).
 *
 * Uso: com o servidor rodando (npm run build && npm start), execute
 *   BASE_URL=http://localhost:3000 ADMIN_PASSWORD=... node scripts/e2e.cjs
 * Requer o pacote "playwright" e um Chromium instalado (npx playwright install chromium).
 * Screenshots são salvos em e2e-output/.
 */
const { chromium, devices } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.join(process.cwd(), "e2e-output");
const PW = process.env.ADMIN_PASSWORD;
const PRO = "/showroom/smartphone-demonstrativo-pro?debug3d";
fs.mkdirSync(OUT, { recursive: true });

const results = [];
async function test(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log(`  ✓ ${name}`);
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
    console.log(`  ✗ ${name}\n      ${e.message.split("\n")[0]}`);
  }
}
const assert = (c, m) => { if (!c) throw new Error(m); };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const GL_ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];

async function viewerReady(page) {
  await page.waitForFunction(() => window.__bbmViewer && window.__bbmViewer.materials().length > 5, null, { timeout: 30000 });
  await page.waitForTimeout(600);
}
const cam = (page) => page.evaluate(() => window.__bbmViewer.camera());
const vstate = (page) => page.evaluate(() => ({ cam: window.__bbmViewer.camera(), target: window.__bbmViewer.target(), d: window.__bbmViewer.distance() }));

async function waitSettled(page, ms = 6000) {
  await page.waitForTimeout(500);
  let prev = await cam(page), stable = 0;
  const end = Date.now() + ms;
  while (Date.now() < end && stable < 3) {
    await page.waitForTimeout(250);
    const now = await cam(page);
    stable = dist(prev, now) < 0.0005 ? stable + 1 : 0;
    prev = now;
  }
  return prev;
}
/** Espera a câmera chegar perto de uma posição esperada (SwiftShader roda a poucos fps). */
async function waitNear(page, expected, tol = 0.05, ms = 10000) {
  const end = Date.now() + ms;
  let c = await cam(page);
  while (Date.now() < end) {
    if (dist(c, expected) < tol) return c;
    await page.waitForTimeout(200);
    c = await cam(page);
  }
  return c;
}

(async () => {
  const browser = await chromium.launch({ args: GL_ARGS });
  const errors = [];

  // ---------- Desktop ----------
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));

  console.log("\nHome");
  await test("Hero carrega com título, subtítulo e botões funcionais", async () => {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    const h1 = await page.textContent("h1");
    assert(h1.includes("TECNOLOGIA QUE VOCÊ PODE SENTIR") || h1.toUpperCase().includes("TECNOLOGIA QUE VOCÊ PODE SENTIR"), "título ausente");
    assert((await page.textContent("[data-testid=hero]")).includes("Explore cada detalhe. Descubra seu próximo Apple."), "subtítulo ausente");
    assert((await page.getAttribute("[data-testid=hero-explore]", "href")).startsWith("/showroom/"), "Explorar em 3D sem destino");
    assert((await page.getAttribute("[data-testid=hero-products]", "href")) === "/#produtos", "Conhecer produtos sem destino");
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/home-intro.png` });
  });
  await test("Introdução pode ser pulada e não bloqueia a navegação", async () => {
    const skip = page.locator("[data-testid=hero-skip]");
    if (await skip.count()) await skip.click();
    await page.waitForSelector("[data-testid=hero-skip]", { state: "detached", timeout: 3000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/home-hero.png` });
    await page.click("[data-testid=hero-products]");
    await page.waitForTimeout(800);
    assert(await page.locator("#produtos").isVisible(), "catálogo não ficou visível");
  });
  await test("Scroll storytelling: 5 cenas e botão Explorar em 3D ao final", async () => {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    const sec = await page.$("[data-testid=story]");
    const box = await sec.boundingBox();
    const scrollTop = await page.evaluate(() => window.scrollY);
    const top = box.y + scrollTop;
    const span = box.height - 900;
    for (let i = 0; i < 5; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), top + span * (i / 4));
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${OUT}/story-${i + 1}.png` });
    }
    assert(await page.locator("[data-testid=story-explore]").isVisible(), "botão final não visível");
    // scroll nativo continua: dá para passar da seção
    await page.evaluate((y) => window.scrollTo(0, y), top + box.height + 200);
    await page.waitForTimeout(300);
    assert((await page.evaluate(() => window.scrollY)) > top + box.height - 10, "scroll bloqueado");
  });
  await test("Home não carrega todos os modelos (só o destaque)", async () => {
    const fresh = await browser.newContext({ viewport: { width: 1440, height: 900 } }); // sem cache
    const p2 = await fresh.newPage();
    const models = [];
    p2.on("request", (r) => /\.(glb|gltf)/.test(r.url()) && models.push(r.url()));
    await p2.goto(BASE + "/", { waitUntil: "networkidle" });
    const t0 = Date.now();
    while (!models.length && Date.now() - t0 < 20000) await p2.waitForTimeout(250);
    await p2.waitForTimeout(3000); // tempo para qualquer outro modelo (não deveria) ser pedido
    await fresh.close();
    const unique = [...new Set(models.map((u) => new URL(u).pathname))];
    assert(unique.length === 1 && unique[0].includes("demo-pro"), `modelos carregados: ${unique.join(", ")}`);
  });
  await test("Categorias: abas filtram o catálogo sem recarregar", async () => {
    await page.goto(BASE + "/#produtos", { waitUntil: "networkidle" });
    const all = await page.locator("[data-testid^=card-]").count();
    await page.click("[data-testid=tab-dobraveis]");
    const fold = await page.locator("[data-testid^=card-]").count();
    assert(all >= 5 && fold === 1, `todos=${all} dobráveis=${fold}`);
    assert(await page.locator("[data-testid=card-dobravel-demonstrativo]").isVisible(), "card do dobrável ausente");
    await page.click("[data-testid=tab-todos]");
    assert((await page.locator("[data-testid^=card-]").count()) === all, "aba Todos não restaurou");
  });
  await test("Página de categoria lista só os aparelhos dela", async () => {
    const r = await page.goto(BASE + "/categorias/xiaomi", { waitUntil: "networkidle" });
    assert(r.status() === 200, `status ${r.status()}`);
    const cards = await page.$$eval("[data-testid^=card-]", (els) => els.map((e) => e.dataset.testid));
    assert(cards.length === 1 && cards[0] === "card-smartphone-demonstrativo-camera-circular", JSON.stringify(cards));
    assert((await page.goto(BASE + "/categorias/nao-existe")).status() === 404, "categoria inexistente não deu 404");
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
  });
  await test("Catálogo: cada produto tem VISUALIZAR EM 3D apontando ao showroom", async () => {
    const links = await page.$$eval("[data-testid^=view3d-]", (as) => as.map((a) => a.getAttribute("href")));
    assert(links.length >= 2 && links.every((h) => h.startsWith("/showroom/")), JSON.stringify(links));
  });

  console.log("\nShowroom (desktop)");
  await page.goto(BASE + PRO, { waitUntil: "networkidle" });
  await test("Modelo GLB carrega (Draco) com materiais nomeados", async () => {
    await viewerReady(page);
    const mats = await page.evaluate(() => window.__bbmViewer.materials());
    for (const m of ["Frame", "BackGlass", "Screen", "LensGlass"]) assert(mats.includes(m), `material ${m} ausente`);
    await page.click("[data-testid=btn-autorotate]"); // pausa para os testes
    await page.screenshot({ path: `${OUT}/showroom-desktop.png` });
  });
  const canvasBox = await page.locator("[data-testid=product-3d-viewer] canvas").boundingBox();
  const cx = canvasBox.x + canvasBox.width / 2, cy = canvasBox.y + canvasBox.height / 2;

  await test("Rotação 360° com mouse (arrasto horizontal completo)", async () => {
    const a = await waitSettled(page);
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let i = 1; i <= 30; i++) await page.mouse.move(cx + i * 12, cy, { steps: 2 });
    await page.mouse.up();
    const b = await waitSettled(page);
    assert(dist(a, b) > 0.5, `câmera não girou (${dist(a, b).toFixed(3)})`);
    // gira bastante: continua orbitando sem perder o alvo
    for (let k = 0; k < 4; k++) {
      await page.mouse.move(cx - 300, cy); await page.mouse.down();
      await page.mouse.move(cx + 300, cy, { steps: 20 }); await page.mouse.up();
    }
    const s = await vstate(page);
    assert(dist(s.target, [0, 0, 0]) < 1e-6, "alvo saiu do aparelho (pan)");
  });
  await test("Ângulo vertical limitado (não vira de cabeça para baixo)", async () => {
    await page.mouse.move(cx, cy); await page.mouse.down();
    await page.mouse.move(cx, cy + 800, { steps: 30 }); await page.mouse.up();
    const s = await vstate(page);
    const polar = Math.acos((s.cam[1] - s.target[1]) / s.d);
    assert(polar >= 0.17 * Math.PI && polar <= 0.83 * Math.PI, `polar ${polar}`);
  });
  await test("Zoom com limites mínimo e máximo", async () => {
    await page.mouse.move(cx, cy);
    for (let i = 0; i < 25; i++) await page.mouse.wheel(0, -400);
    await page.waitForTimeout(1500);
    const near = (await vstate(page)).d;
    for (let i = 0; i < 40; i++) await page.mouse.wheel(0, 400);
    await page.waitForTimeout(1500);
    const far = (await vstate(page)).d;
    assert(near >= 1.6 - 0.02 && near < 2.2, `zoom in → ${near}`);
    assert(far <= 6 + 0.02 && far > 5, `zoom out → ${far}`);
  });
  await test("Botão restaurar visualização volta à câmera inicial", async () => {
    await page.click("[data-testid=btn-reset]");
    const c = await waitNear(page, [1.35, 0.35, 3.25]);
    assert(dist(c, [1.35, 0.35, 3.25]) < 0.05, `câmera ${c}`);
  });
  await test("Vistas frontal, traseira e lateral", async () => {
    for (const [v, pos] of [["front", [0, 0, 3.6]], ["back", [0, 0, -3.6]], ["side", [3.4, 0.15, 0.9]]]) {
      await page.click(`[data-testid=view-${v}]`);
      const c = await waitNear(page, pos);
      assert(dist(c, pos) < 0.05, `${v}: ${c}`);
      await page.screenshot({ path: `${OUT}/view-${v}.png` });
    }
  });
  await test("Troca de cor atualiza o acabamento com transição suave", async () => {
    await page.click("[data-testid=view-back]");
    await waitNear(page, [0, 0, -3.6]);
    await page.click("[data-testid=color-titanio-areia]");
    const seen = new Set();
    for (let i = 0; i < 40; i++) {
      seen.add(await page.evaluate(() => window.__bbmViewer.material("Frame")));
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(1500);
    const end = await page.evaluate(() => window.__bbmViewer.material("Frame"));
    assert(end === "b8a487", `cor final ${end}`);
    const intermediates = [...seen].filter((c) => c !== "b8a487" && c !== "8c8a85");
    assert(intermediates.length >= 2, `sem transição gradual (${[...seen].join(",")})`);
    assert((await page.textContent("[data-testid=selected-color]")) === "Titânio Areia", "painel não atualizou");
    await page.screenshot({ path: `${OUT}/color-areia.png` });
  });
  await test("Cor indisponível nunca aparece como disponível", async () => {
    await page.click("[data-testid=color-titanio-azul]");
    await page.waitForTimeout(200);
    assert((await page.textContent("[data-testid=availability]")).includes("Indisponível"), "disponibilidade errada");
    assert((await page.textContent("[data-testid=showroom-whatsapp]")).includes("Consultar disponibilidade"), "CTA errado");
    await page.click("[data-testid=cap-512gb]");
    assert((await page.textContent("[data-testid=availability]")).includes("Indisponível"), "capacidade indisponível tratada como disponível");
    await page.click("[data-testid=color-titanio-preto]");
    await page.click("[data-testid=cap-256gb]");
    assert((await page.textContent("[data-testid=availability]")) === "Disponível", "combinação disponível não reconhecida");
  });
  await test("Hotspot: câmera aproxima, ficha técnica aparece e retorno funciona", async () => {
    await page.click("[data-testid=chip-cameras]");
    await page.waitForSelector("[data-testid=hotspot-sheet]");
    const c = await waitNear(page, [0.62, 0.78, -1.3]);
    await waitSettled(page);
    assert(dist(c, [0.62, 0.78, -1.3]) < 0.05, `câmera do hotspot ${c}`);
    const t = (await vstate(page)).target;
    assert(dist(t, [0.136, 0.516, -0.05]) < 0.02, "alvo do hotspot errado");
    assert((await page.textContent("[data-testid=hotspot-sheet]")).includes("Sistema de câmeras"), "ficha errada");
    await page.screenshot({ path: `${OUT}/hotspot-cameras.png` });
    // órbita restrita enquanto focado: não dá a volta pelo aparelho
    await page.mouse.move(cx, cy); await page.mouse.down();
    await page.mouse.move(cx + 900, cy, { steps: 30 }); await page.mouse.up();
    const s = await vstate(page);
    assert(s.cam[2] < 0, "câmera atravessou para a frente do aparelho durante o foco");
    await page.click("[data-testid=sheet-close]");
    const back = await waitNear(page, [1.35, 0.35, 3.25]);
    assert(dist(back, [1.35, 0.35, 3.25]) < 0.05, `não voltou: ${back}`);
  });
  await test("Marcadores 3D de hotspot são clicáveis e somem de costas", async () => {
    await page.click("[data-testid=view-front]");
    await waitNear(page, [0, 0, 3.6]);
    await page.waitForTimeout(400);
    const facing = await page.$$eval("[data-hotspot]", (els) => Object.fromEntries(els.map((e) => [e.dataset.hotspot, e.dataset.facing])));
    assert(facing.tela === "1" && facing.cameras === "0", JSON.stringify(facing));
    await page.click("[data-hotspot=tela]");
    await page.waitForSelector("[data-testid=hotspot-sheet]");
    await page.keyboard.press("Escape");
    await page.waitForSelector("[data-testid=hotspot-sheet]", { state: "detached" });
  });
  await test("Rotação automática opcional (liga/desliga)", async () => {
    await waitSettled(page);
    const a = await cam(page);
    await page.waitForTimeout(800);
    assert(dist(a, await cam(page)) < 0.002, "girando com rotação desligada");
    await page.click("[data-testid=btn-autorotate]");
    await page.waitForTimeout(2500); // a rotação automática do OrbitControls é por quadro; SwiftShader é lento
    assert(dist(a, await cam(page)) > 0.01, "rotação automática não girou");
    await page.click("[data-testid=btn-autorotate]");
  });
  await test("Tela cheia", async () => {
    await page.click("[data-testid=btn-fullscreen]");
    await page.waitForTimeout(1600);
    const fs1 = await page.evaluate(() => !!document.fullscreenElement || !!document.querySelector("[data-testid=product-3d-viewer].\\!fixed"));
    assert(fs1, "não entrou em tela cheia");
    await page.click("[data-testid=btn-fullscreen]");
    await page.waitForTimeout(1500);
    const fs2 = await page.evaluate(() => !!document.fullscreenElement || !!document.querySelector("[data-testid=product-3d-viewer].\\!fixed"));
    assert(!fs2, "não saiu da tela cheia");
  });
  await test("Botões de WhatsApp com mensagem contextual", async () => {
    const hrefs = await page.$$eval("a[href*='wa.me']", (as) => as.map((a) => ({ href: a.href, target: a.target, rel: a.rel })));
    assert(hrefs.length >= 2, "poucos links de WhatsApp");
    for (const h of hrefs) {
      assert(/^https:\/\/wa\.me\/\d*\?text=/.test(h.href), `link inválido ${h.href}`);
      assert(h.target === "_blank" && h.rel.includes("noopener"), "link sem target/rel");
      assert(decodeURIComponent(h.href.split("text=")[1]).length > 10, "mensagem vazia");
    }
  });
  await test("Navegação entre produtos sem voltar à home", async () => {
    await page.click("[data-testid=nav-next]");
    await page.waitForURL(/smartphone-demonstrativo-compact/);
    await page.goto(BASE + "/showroom/smartphone-demonstrativo-compact?debug3d");
    await viewerReady(page);
    assert((await page.textContent("h1")).includes("Compact"), "produto errado");
    await page.screenshot({ path: `${OUT}/showroom-compact.png` });
  });
  await test("Dobrável: abre e fecha em 3D; detalhe da tela interna abre o aparelho", async () => {
    await page.goto(BASE + "/showroom/dobravel-demonstrativo?debug3d", { waitUntil: "networkidle" });
    await viewerReady(page);
    const art = () => page.evaluate(() => window.__bbmViewer.articulation().dobra);
    assert(Math.abs((await art()) - 1) < 0.01, "não começou fechado");
    await page.click("[data-testid=articulation-toggle-dobra]");
    const t0 = Date.now();
    while ((await art()) > 0.01 && Date.now() - t0 < 10000) await page.waitForTimeout(200);
    assert((await art()) <= 0.01, `não abriu (${await art()})`);
    await page.screenshot({ path: `${OUT}/fold-open.png` });
    await page.click("[data-testid=articulation-toggle-dobra]");
    await page.waitForTimeout(300);
    await page.click("[data-testid=chip-tela-interna]");
    await page.waitForSelector("[data-testid=hotspot-sheet]");
    const t1 = Date.now();
    while ((await art()) > 0.01 && Date.now() - t1 < 10000) await page.waitForTimeout(200);
    assert((await art()) <= 0.01, "detalhe da tela interna não abriu o aparelho");
    await page.click("[data-testid=sheet-close]");
    // categoria aparece no painel e leva à página da categoria
    assert((await page.getAttribute("[data-testid=showroom-category]", "href")) === "/categorias/dobraveis", "link da categoria");
  });
  await test("Página de produto tem VISUALIZAR EM 3D", async () => {
    await page.goto(BASE + "/produtos/smartphone-demonstrativo-pro");
    assert((await page.getAttribute("[data-testid=product-view3d]", "href")) === "/showroom/smartphone-demonstrativo-pro", "link errado");
  });
  await test("Falha ao carregar o modelo mostra erro e permite tentar de novo", async () => {
    const p3 = await ctx.newPage();
    let fail = true;
    await p3.route("**/models/demo-pro.glb", (r) => (fail ? r.fulfill({ status: 404, body: "x" }) : r.continue()));
    await p3.goto(BASE + PRO);
    await p3.waitForSelector("[data-testid=viewer-fallback]", { timeout: 15000 });
    assert((await p3.textContent("[data-testid=viewer-fallback]")).includes("Não foi possível carregar"), "mensagem ausente");
    fail = false;
    await p3.click("text=Tentar novamente");
    await viewerReady(p3);
    await p3.close();
  });
  await test("Sem regressões de console/JS", async () => {
    const relevant = errors.filter((e) => !e.includes("404") && !e.includes("Failed to load resource"));
    assert(relevant.length === 0, relevant.slice(0, 3).join(" | "));
  });
  await ctx.close();

  // ---------- Mobile (toque) ----------
  console.log("\nMobile");
  const mctx = await browser.newContext({ ...devices["Pixel 7"] });
  const m = await mctx.newPage();
  await m.goto(BASE + PRO, { waitUntil: "networkidle" });
  await viewerReady(m);
  await m.click("[data-testid=btn-autorotate]");
  const mb = await m.locator("[data-testid=product-3d-viewer] canvas").boundingBox();
  const mx = mb.x + mb.width / 2, my = mb.y + mb.height / 2;
  const cdp = await mctx.newCDPSession(m);
  const touch = (type, points) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points.map(([x, y], id) => ({ x, y, id })) });
  await test("Rotação por toque (um dedo)", async () => {
    const a = await waitSettled(m);
    await touch("touchStart", [[mx - 100, my]]);
    for (let i = 1; i <= 15; i++) await touch("touchMove", [[mx - 100 + i * 14, my]]);
    await touch("touchEnd", []);
    const b = await waitSettled(m);
    assert(dist(a, b) > 0.3, `não girou por toque (${dist(a, b).toFixed(3)})`);
  });
  await test("Zoom por pinça (dois dedos) respeita limites", async () => {
    const d0 = (await vstate(m)).d;
    await touch("touchStart", [[mx - 30, my], [mx + 30, my]]);
    for (let i = 1; i <= 15; i++) await touch("touchMove", [[mx - 30 - i * 8, my], [mx + 30 + i * 8, my]]);
    await touch("touchEnd", []);
    await m.waitForTimeout(1200);
    const d1 = (await vstate(m)).d;
    assert(d1 < d0 - 0.2 && d1 >= 1.58, `pinça: ${d0} → ${d1}`);
  });
  await test("Pixel ratio limitado no celular", async () => {
    const dpr = await m.evaluate(() => window.__bbmViewer.dpr);
    assert(dpr <= 1.5, `dpr ${dpr}`);
  });
  await test("Hotspot e troca de cor no celular", async () => {
    await m.click("[data-testid=chip-tela]");
    await m.waitForSelector("[data-testid=hotspot-sheet]");
    await m.screenshot({ path: `${OUT}/mobile-hotspot.png` });
    await m.click("[data-testid=sheet-close]");
    await m.click("[data-testid=color-titanio-preto]");
    await m.waitForTimeout(1800);
    assert((await m.evaluate(() => window.__bbmViewer.material("Frame"))) === "3a3a3c", "cor não aplicada");
    await m.screenshot({ path: `${OUT}/mobile-showroom.png`, fullPage: true });
  });
  await test("Home mobile: toque rola a página (hero não captura o gesto)", async () => {
    await m.goto(BASE + "/", { waitUntil: "networkidle" });
    await m.waitForTimeout(1500);
    const skip = m.locator("[data-testid=hero-skip]");
    if (await skip.count()) await skip.click();
    await m.waitForTimeout(800);
    await m.screenshot({ path: `${OUT}/mobile-home.png` });
    // (Gestos de rolagem sintéticos não rolam páginas no Chromium headless; verificamos
    // as condições que permitem a rolagem nativa: o toque não cai no canvas e nada bloqueia o pan.)
    const probe = () => m.evaluate(() => {
      const el = document.elementFromPoint(200, 300);
      const canvas = document.querySelector("[data-testid=hero] canvas");
      // touch-action efetivo do elemento que recebe o toque: um ancestral com "none" bloqueia o pan.
      let blocked = false;
      for (let n = el; n; n = n.parentElement) if (getComputedStyle(n).touchAction === "none") blocked = true;
      return { onCanvas: el === canvas, touchAction: blocked ? "none" : "auto" };
    });
    const idle = await probe();
    assert(!idle.onCanvas, "o toque cai no canvas e pode capturar o gesto de rolagem");
    assert(idle.touchAction !== "none", `touch-action ${idle.touchAction}`);
    await m.click("[data-testid=hero-interact]");
    await m.waitForTimeout(300);
    const active = await probe();
    assert(active.onCanvas && active.touchAction === "none", `modo girar não ativou: ${JSON.stringify(active)}`);
    await m.click("[data-testid=hero-interact]");
    assert(await m.locator("[data-testid=hero-interact]").isVisible(), "botão Girar aparelho ausente");
  });
  await mctx.close();

  // ---------- Responsivo ----------
  console.log("\nResponsivo");
  for (const w of [360, 768, 1024, 1440]) {
    await test(`Sem rolagem horizontal em ${w}px (home e showroom)`, async () => {
      const c = await browser.newContext({ viewport: { width: w, height: 800 } });
      const p = await c.newPage();
      for (const url of ["/", PRO, "/produtos"]) {
        await p.goto(BASE + url, { waitUntil: "networkidle" });
        await p.waitForTimeout(500);
        const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert(over <= 0, `${url}: ${over}px de overflow`);
      }
      await p.screenshot({ path: `${OUT}/showroom-${w}.png` });
      await c.close();
    });
  }

  // ---------- Acessibilidade de movimento ----------
  console.log("\nprefers-reduced-motion");
  await test("Sem introdução animada e sem rotação automática", async () => {
    const c = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
    const p = await c.newPage();
    await p.goto(BASE + "/", { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    assert((await p.locator("[data-testid=hero-skip]").count()) === 0, "introdução ainda rodando");
    await p.goto(BASE + PRO, { waitUntil: "networkidle" });
    await viewerReady(p);
    assert((await p.getAttribute("[data-testid=btn-autorotate]", "aria-pressed")) === "false", "autorotate ligado");
    await c.close();
  });

  await browser.close();

  // ---------- Sem WebGL ----------
  console.log("\nSem WebGL");
  const noGl = await chromium.launch({ args: ["--disable-webgl", "--disable-webgl2", "--disable-3d-apis"] });
  await test("Fallback visual quando o navegador não tem WebGL", async () => {
    const p = await noGl.newPage({ viewport: { width: 1280, height: 800 } });
    await p.goto(BASE + "/showroom/smartphone-demonstrativo-pro", { waitUntil: "networkidle" });
    await p.waitForSelector("[data-testid=viewer-fallback]");
    assert((await p.textContent("[data-testid=viewer-fallback]")).includes("não suporta WebGL"), "mensagem ausente");
    assert(await p.locator("[data-testid=showroom-whatsapp]").isVisible(), "painel/atendimento indisponível");
    await p.screenshot({ path: `${OUT}/nowebgl.png` });
    await p.goto(BASE + "/", { waitUntil: "networkidle" });
    await p.waitForTimeout(800);
    assert(await p.locator("[data-testid=hero-explore]").isVisible(), "hero quebrou sem WebGL");
  });
  await noGl.close();

  // ---------- Painel administrativo ----------
  console.log("\nPainel administrativo (API)");
  const api = async (url, opts = {}, cookie) => {
    const headers = { Origin: BASE, ...(opts.headers || {}) };
    if (cookie) headers.Cookie = cookie;
    return fetch(BASE + url, { ...opts, headers, redirect: "manual" });
  };
  await test("Rotas protegidas exigem autenticação", async () => {
    assert((await api("/api/admin/products")).status === 401, "listagem sem login");
    const fd = new FormData(); fd.append("file", new Blob(["x"]), "a.glb");
    assert((await api("/api/admin/upload", { method: "POST", body: fd })).status === 401, "upload sem login");
    const r = await fetch(BASE + "/admin", { redirect: "manual" });
    assert(r.status === 307 && r.headers.get("location").includes("/admin/login"), "página admin sem redirecionar");
  });
  let cookie = null;
  await test("Login: senha errada recusada, correta cria sessão HttpOnly", async () => {
    if (!PW) throw new Error("defina ADMIN_PASSWORD para testar o painel");
    const bad = await api("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "errada" }) });
    assert(bad.status === 401, `senha errada → ${bad.status}`);
    const ok = await api("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: PW }) });
    assert(ok.status === 200, `login → ${ok.status}`);
    const sc = ok.headers.get("set-cookie");
    assert(/HttpOnly/i.test(sc) && /SameSite=Strict/i.test(sc), "cookie inseguro");
    cookie = sc.split(";")[0];
  });
  await test("Requisição de outra origem é bloqueada (CSRF)", async () => {
    const r = await fetch(BASE + "/api/admin/products", { headers: { Cookie: cookie, Origin: "https://evil.example" } });
    assert(r.status === 403, `→ ${r.status}`);
  });
  let uploaded = null;
  await test("Upload valida tipo e conteúdo (rejeita falso GLB e imagem disfarçada)", async () => {
    const fake = new FormData(); fake.append("file", new Blob([Buffer.from("<script>alert(1)</script>")]), "model.glb");
    const r1 = await api("/api/admin/upload?kind=model", { method: "POST", body: fake }, cookie);
    assert(r1.status === 415, `falso GLB → ${r1.status}`);
    const exe = new FormData(); exe.append("file", new Blob([Buffer.from("MZ....")]), "virus.exe");
    assert((await api("/api/admin/upload?kind=model", { method: "POST", body: exe }, cookie)).status === 415, "exe aceito");
    const img = new FormData(); img.append("file", new Blob([Buffer.from("GIF89a")]), "x.png");
    assert((await api("/api/admin/upload?kind=image", { method: "POST", body: img }, cookie)).status === 415, "imagem falsa aceita");
  });
  await test("Upload de GLB real é armazenado fora de /public e servido com tipo correto", async () => {
    const glb = fs.readFileSync(path.join(process.cwd(), "public/models/demo-compact.glb"));
    const fd = new FormData(); fd.append("file", new Blob([glb]), "meu-modelo.glb");
    const r = await api("/api/admin/upload?kind=model", { method: "POST", body: fd }, cookie);
    const body = await r.text();
    assert(r.status === 201, `→ ${r.status} ${body}`);
    uploaded = JSON.parse(body).url;
    assert(/^\/api\/models\/[a-f0-9-]{36}\.glb$/.test(uploaded), uploaded);
    const g = await fetch(BASE + uploaded);
    assert(g.status === 200 && g.headers.get("content-type") === "model/gltf-binary", "arquivo não servido");
    assert((await fetch(BASE + "/api/models/..%2F..%2Fdata%2Fproducts.json")).status === 404, "path traversal");
  });
  await test("Cadastrar, publicar, despublicar e excluir um smartphone", async () => {
    const list = await (await api("/api/admin/products", {}, cookie)).json();
    const base = list.find((p) => p.id === "demo-compact");
    const novo = { ...base, id: "teste-e2e", slug: "teste-e2e", name: "Teste E2E", published: false, model: { ...base.model, url: uploaded } };
    delete novo.updatedAt;
    let r = await api("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(novo) }, cookie);
    const created = await r.text();
    assert(r.status === 201, `criar → ${r.status} ${created}`);
    assert((await fetch(BASE + "/showroom/teste-e2e")).status === 404, "rascunho visível ao público");
    r = await api("/api/admin/products/teste-e2e", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...novo, published: true }) }, cookie);
    assert(r.status === 200, `publicar → ${r.status}`);
    assert((await fetch(BASE + "/showroom/teste-e2e")).status === 200, "publicado não aparece");
    const bad = await api("/api/admin/products/teste-e2e", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...novo, model: { ...novo.model, url: "https://evil.example/x.glb" } }) }, cookie);
    assert(bad.status === 400, "URL de modelo externa aceita");
    r = await api("/api/admin/products/teste-e2e", { method: "DELETE" }, cookie);
    assert(r.status === 200, `excluir → ${r.status}`);
  });
  await test("Categorias no painel: editar e impedir exclusão de categoria em uso", async () => {
    const cats = await (await api("/api/admin/categories", {}, cookie)).json();
    assert(cats.length >= 4, "categorias não listadas");
    const without = cats.filter((c) => c.id !== "xiaomi");
    const r = await api("/api/admin/categories", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(without) }, cookie);
    assert(r.status === 409, `excluir categoria em uso → ${r.status}`);
    const renamed = cats.map((c) => (c.id === "xiaomi" ? { ...c, description: "Teste E2E" } : c));
    const ok = await api("/api/admin/categories", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(renamed) }, cookie);
    assert(ok.status === 200, `salvar → ${ok.status}`);
    const back = await api("/api/admin/categories", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cats) }, cookie);
    assert(back.status === 200, "restaurar categorias");
  });
  await test("Editor do painel abre com preview 3D", async () => {
    const b = await chromium.launch({ args: GL_ARGS });
    const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
    await c.addCookies([{ name: cookie.split("=")[0], value: cookie.split("=")[1], url: BASE }]);
    const p = await c.newPage();
    await p.goto(BASE + "/admin/produtos/demo-pro", { waitUntil: "networkidle" });
    await p.waitForSelector("text=Materiais que recebem a cor");
    await p.waitForSelector("label:has-text('BackGlass')", { timeout: 20000 });
    await p.screenshot({ path: `${OUT}/admin-editor.png` });
    await b.close();
  });

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} testes passaram. Screenshots em ${OUT}`);
  fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 2));
  process.exit(failed.length ? 1 : 0);
})();
