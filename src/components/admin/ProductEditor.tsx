"use client";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { articulation as articulationSchema, product as productSchema, type CameraView, type Category, type ColorVariant, type Hotspot, type Product, type Spec, type Vec3 } from "@/lib/schema";
import type { PreviewHandle } from "./AdminPreview";

const AdminPreview = dynamic(() => import("./AdminPreview").then((m) => m.AdminPreview), { ssr: false });

const VIEWS = [
  ["initial", "Câmera inicial"],
  ["front", "Vista frontal"],
  ["back", "Vista traseira"],
  ["side", "Vista lateral"],
] as const;

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);

const specsToText = (s: Spec[]) => s.map((x) => `${x.label}: ${x.value}`).join("\n");
const textToSpecs = (t: string): Spec[] =>
  t.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const i = l.indexOf(":");
    return i > 0 ? { label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() } : { label: l, value: "-" };
  }).filter((s) => s.label && s.value);

async function upload(file: File, kind: "model" | "image"): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`/api/admin/upload?kind=${kind}`, { method: "POST", body: fd });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Falha no envio (${res.status})`);
  return json.url as string;
}

export function ProductEditor({ initial, isNew, categories }: { initial: Product; isNew: boolean; categories: Category[] }) {
  const router = useRouter();
  const [p, setP] = useState<Product>(initial);
  const [materials, setMaterials] = useState<string[]>([]);
  const [previewColor, setPreviewColor] = useState(initial.colors[0]?.id ?? "");
  const [pickFor, setPickFor] = useState<number | null>(null);
  const [status, setStatus] = useState<{ kind: "ok" | "error" | "busy"; msg: string } | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const preview = useRef<PreviewHandle>(null);

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));
  const setModel = (patch: Partial<Product["model"]>) => setP((x) => ({ ...x, model: { ...x.model, ...patch } }));
  const setCam = (patch: Partial<Product["camera"]>) => setP((x) => ({ ...x, camera: { ...x.camera, ...patch } }));
  const setColor = (i: number, patch: Partial<ColorVariant>) =>
    setP((x) => ({ ...x, colors: x.colors.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));
  const setHotspot = (i: number, patch: Partial<Hotspot>) =>
    setP((x) => ({ ...x, hotspots: x.hotspots.map((h, j) => (j === i ? { ...h, ...patch } : h)) }));

  const onMaterials = useCallback((names: string[]) => setMaterials(names), []);

  const doUpload = async (file: File | undefined, kind: "model" | "image", apply: (url: string) => void) => {
    if (!file) return;
    setStatus({ kind: "busy", msg: `Enviando ${file.name}…` });
    try {
      apply(await upload(file, kind));
      setStatus({ kind: "ok", msg: `${file.name} enviado.` });
    } catch (e) {
      setStatus({ kind: "error", msg: (e as Error).message });
    }
  };

  const save = async () => {
    const parsed = productSchema.safeParse(p);
    if (!parsed.success) {
      setIssues(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
      setStatus({ kind: "error", msg: "Corrija os campos destacados abaixo." });
      return;
    }
    setIssues([]);
    setStatus({ kind: "busy", msg: "Salvando…" });
    const res = await fetch(isNew ? "/api/admin/products" : `/api/admin/products/${initial.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus({ kind: "error", msg: json.error ?? "Falha ao salvar" });
      if (json.issues) setIssues(json.issues.map((i: { path: string[]; message: string }) => `${i.path.join(".")}: ${i.message}`));
      return;
    }
    setStatus({ kind: "ok", msg: "Produto salvo." });
    if (isNew) router.replace(`/admin/produtos/${parsed.data.id}`);
    else router.refresh();
  };

  const capture = (key: (typeof VIEWS)[number][0]) => {
    const v = preview.current?.captureCamera();
    if (v) setCam({ [key]: v } as Partial<Product["camera"]>);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(380px,46%)]">
      <div className="space-y-6">
        <Section title="Informações comerciais">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do modelo">
              <input className="field" value={p.name} onChange={(e) => {
                const name = e.target.value;
                setP((x) => ({ ...x, name, ...(isNew ? { id: slugify(name), slug: slugify(name) } : {}) }));
              }} data-testid="f-name" />
            </Field>
            <Field label="Condição"><input className="field" value={p.condition} onChange={(e) => set("condition", e.target.value)} placeholder="Novo, Seminovo…" /></Field>
            <Field label="Categoria">
              <select className="field" value={p.category} onChange={(e) => set("category", e.target.value)} data-testid="f-category">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="outros">Outros (sem categoria)</option>
              </select>
            </Field>
            <Field label="Identificador"><input className="field" value={p.id} onChange={(e) => set("id", e.target.value)} disabled={!isNew} /></Field>
            <Field label="Slug (URL)"><input className="field" value={p.slug} onChange={(e) => set("slug", e.target.value)} /></Field>
          </div>
          <Field label="Chamada curta"><input className="field" value={p.tagline} onChange={(e) => set("tagline", e.target.value)} /></Field>
          <Field label="Descrição"><textarea className="field min-h-24" value={p.description} onChange={(e) => set("description", e.target.value)} /></Field>
          <Field label="Mensagem do WhatsApp (opcional)"><input className="field" value={p.whatsappMessage ?? ""} onChange={(e) => set("whatsappMessage", e.target.value || undefined)} /></Field>
          <div className="flex flex-wrap gap-6">
            <Check label="Publicado" checked={p.published} onChange={(v) => set("published", v)} />
            <Check label="Modelo demonstrativo (exibe selo)" checked={p.demo} onChange={(v) => set("demo", v)} />
          </div>
          <Field label="Imagem estática (PNG/JPG/WebP — usada no catálogo e sem WebGL)">
            <div className="flex items-center gap-3">
              <input type="file" accept="image/png,image/jpeg,image/webp" className="text-sm text-mute" onChange={(e) => doUpload(e.target.files?.[0], "image", (url) => set("poster", url))} />
              {p.poster && <span className="truncate text-xs text-mute">{p.poster}</span>}
            </div>
          </Field>
        </Section>

        <Section title="Modelo 3D">
          <Field label="Arquivo GLB/GLTF (autocontido)">
            <div className="flex flex-col gap-2">
              <input type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" className="text-sm text-mute" onChange={(e) => doUpload(e.target.files?.[0], "model", (url) => setModel({ url }))} data-testid="f-model-file" />
              <input className="field" value={p.model.url} onChange={(e) => setModel({ url: e.target.value })} />
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field label="Escala"><Num value={p.model.scale} onChange={(v) => setModel({ scale: v })} step={0.1} /></Field>
            <button type="button" className="btn-ghost" onClick={() => {
              const fit = preview.current?.autoFit();
              if (fit) setModel(fit);
            }}>Auto-ajustar (altura 1,5)</button>
          </div>
          <Field label="Posição (x, y, z)"><VecInput value={p.model.position} onChange={(v) => setModel({ position: v })} /></Field>
          <Field label="Rotação em graus (x, y, z)">
            <VecInput value={p.model.rotation.map((r) => Math.round((r * 180) / Math.PI * 10) / 10) as Vec3} onChange={(v) => setModel({ rotation: v.map((d) => (d * Math.PI) / 180) as Vec3 })} />
          </Field>
          <Field label="Materiais que recebem a cor (detectados no arquivo)">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {materials.length === 0 && <span className="text-xs text-mute">Carregando materiais do modelo…</span>}
              {materials.map((m) => (
                <Check key={m} label={m} checked={p.model.tintMaterials.includes(m)} onChange={(v) =>
                  setModel({ tintMaterials: v ? [...p.model.tintMaterials, m] : p.model.tintMaterials.filter((x) => x !== m) })} />
              ))}
            </div>
          </Field>
          <Field label="Telas adicionais (ex.: tela interna de dobrável)">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {materials.filter((m) => m !== p.model.screenMaterial).map((m) => (
                <Check key={m} label={m} checked={p.model.screenMaterials.includes(m)} onChange={(v) =>
                  setModel({ screenMaterials: v ? [...p.model.screenMaterials, m] : p.model.screenMaterials.filter((x) => x !== m) })} />
              ))}
            </div>
          </Field>
          <Field label="Peças móveis — articulações (avançado, JSON)">
            <textarea
              className="field min-h-28 font-mono text-xs"
              defaultValue={JSON.stringify(p.model.articulations, null, 2)}
              onBlur={(e) => {
                try {
                  const parsed = articulationSchema.array().max(4).parse(JSON.parse(e.target.value || "[]"));
                  setModel({ articulations: parsed });
                  setStatus({ kind: "ok", msg: "Articulações atualizadas no preview." });
                } catch (err) {
                  setStatus({ kind: "error", msg: `Articulações inválidas: ${(err as Error).message.slice(0, 160)}` });
                }
              }}
              data-testid="f-articulations"
            />
            <span className="mt-1 block text-xs text-mute">
              Formato: [{"{"}&quot;id&quot;, &quot;label&quot;, &quot;labels&quot;: [&quot;Abrir&quot;, &quot;Fechar&quot;], &quot;default&quot;: 0..1, &quot;parts&quot;: [{"{"}&quot;node&quot;, &quot;axis&quot;: &quot;y&quot;, &quot;from&quot;, &quot;to&quot; (radianos){"}"}]{"}"}]. O nó precisa existir no arquivo 3D.
            </span>
          </Field>
          <Field label="Material da tela (opcional)">
            <select className="field" value={p.model.screenMaterial ?? ""} onChange={(e) => setModel({ screenMaterial: e.target.value || undefined })}>
              <option value="">Nenhum</option>
              {materials.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="Câmera">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="FOV"><Num value={p.camera.fov} onChange={(v) => setCam({ fov: v })} /></Field>
            <Field label="Zoom mínimo (distância)"><Num value={p.camera.minDistance} onChange={(v) => setCam({ minDistance: v })} step={0.1} /></Field>
            <Field label="Zoom máximo (distância)"><Num value={p.camera.maxDistance} onChange={(v) => setCam({ maxDistance: v })} step={0.1} /></Field>
          </div>
          {VIEWS.map(([key, label]) => (
            <ViewEditor key={key} label={label} value={p.camera[key]} onChange={(v) => setCam({ [key]: v } as Partial<Product["camera"]>)}
              onCapture={() => capture(key)} onPreview={() => preview.current?.setCamera(p.camera[key])} />
          ))}
        </Section>

        <Section title="Cores e variantes">
          {p.colors.map((c, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-line p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <Field label="Nome"><input className="field" value={c.name} onChange={(e) => setColor(i, { name: e.target.value, id: isNew || !c.id ? slugify(e.target.value) : c.id })} /></Field>
                <Field label="ID"><input className="field" value={c.id} onChange={(e) => setColor(i, { id: e.target.value })} /></Field>
                <Field label="Cor"><input type="color" className="h-11 w-16 rounded-lg border border-line bg-transparent" value={c.swatch} onChange={(e) => setColor(i, { swatch: e.target.value })} /></Field>
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <Check label="Disponível" checked={c.available} onChange={(v) => setColor(i, { available: v })} />
                <button type="button" className="text-xs text-champagne underline" onClick={() => setPreviewColor(c.id)}>Ver no preview</button>
                {p.colors.length > 1 && <button type="button" className="text-xs text-red-300 underline" onClick={() => set("colors", p.colors.filter((_, j) => j !== i))}>Remover</button>}
              </div>
              <Field label="Acabamento por material (sobrepõe a cor acima)">
                <div className="space-y-2">
                  {Object.entries(c.finishes).map(([mat, f]) => (
                    <div key={mat} className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="w-28 truncate text-bone/80">{mat}</span>
                      <input type="color" value={f.color} onChange={(e) => setColor(i, { finishes: { ...c.finishes, [mat]: { ...f, color: e.target.value } } })} className="h-8 w-10 bg-transparent" aria-label={`Cor de ${mat}`} />
                      <label className="flex items-center gap-1 text-mute">metal<input type="number" min={0} max={1} step={0.05} className="field !w-20 !py-1" value={f.metalness ?? ""} onChange={(e) => setColor(i, { finishes: { ...c.finishes, [mat]: { ...f, metalness: e.target.value === "" ? undefined : Number(e.target.value) } } })} /></label>
                      <label className="flex items-center gap-1 text-mute">rugosidade<input type="number" min={0} max={1} step={0.05} className="field !w-20 !py-1" value={f.roughness ?? ""} onChange={(e) => setColor(i, { finishes: { ...c.finishes, [mat]: { ...f, roughness: e.target.value === "" ? undefined : Number(e.target.value) } } })} /></label>
                      <button type="button" className="text-red-300" onClick={() => { const { [mat]: _, ...rest } = c.finishes; void _; setColor(i, { finishes: rest }); }} aria-label={`Remover ${mat}`}>×</button>
                    </div>
                  ))}
                  <select className="field !w-auto !py-1.5 text-xs" value="" onChange={(e) => e.target.value && setColor(i, { finishes: { ...c.finishes, [e.target.value]: { color: c.swatch } } })}>
                    <option value="">+ adicionar material…</option>
                    {materials.filter((m) => !(m in c.finishes)).map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </Field>
              <Field label="Arquivo 3D próprio da variante (se a geometria/textura muda)">
                <div className="flex flex-col gap-2">
                  <input type="file" accept=".glb,.gltf" className="text-sm text-mute" onChange={(e) => doUpload(e.target.files?.[0], "model", (url) => setColor(i, { modelUrl: url as ColorVariant["modelUrl"] }))} />
                  {c.modelUrl && (
                    <div className="flex items-center gap-3 text-xs text-mute">{c.modelUrl}
                      <button type="button" className="text-red-300 underline" onClick={() => setColor(i, { modelUrl: undefined })}>remover</button>
                    </div>
                  )}
                </div>
              </Field>
            </div>
          ))}
          <button type="button" className="btn-ghost" onClick={() => set("colors", [...p.colors, { id: `cor-${p.colors.length + 1}`, name: `Cor ${p.colors.length + 1}`, swatch: "#888888", available: true, finishes: {} }])}>+ Adicionar cor</button>
        </Section>

        <Section title="Capacidades e preços">
          {p.capacities.map((c, i) => (
            <div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
              <Field label="Capacidade"><input className="field" value={c.label} onChange={(e) => set("capacities", p.capacities.map((x, j) => j === i ? { ...x, label: e.target.value, id: slugify(e.target.value) || x.id } : x))} /></Field>
              <Field label="Preço (R$, vazio = sob consulta)"><input type="number" min={0} step={1} className="field" value={c.price ?? ""} onChange={(e) => set("capacities", p.capacities.map((x, j) => j === i ? { ...x, price: e.target.value === "" ? null : Number(e.target.value) } : x))} /></Field>
              <Check label="Disponível" checked={c.available} onChange={(v) => set("capacities", p.capacities.map((x, j) => j === i ? { ...x, available: v } : x))} />
              <button type="button" className="pb-3 text-xs text-red-300 underline" onClick={() => set("capacities", p.capacities.filter((_, j) => j !== i))}>Remover</button>
            </div>
          ))}
          <button type="button" className="btn-ghost" onClick={() => set("capacities", [...p.capacities, { id: `cap-${p.capacities.length + 1}`, label: "", price: null, available: true }])}>+ Adicionar capacidade</button>
        </Section>

        <Section title="Hotspots">
          <p className="text-xs text-mute">Marque “verificado” somente depois de conferir as informações com a ficha técnica oficial do aparelho.</p>
          {p.hotspots.map((h, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-line p-4" data-testid={`hs-editor-${i}`}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Rótulo"><input className="field" value={h.label} onChange={(e) => setHotspot(i, { label: e.target.value })} /></Field>
                <Field label="ID"><input className="field" value={h.id} onChange={(e) => setHotspot(i, { id: e.target.value })} /></Field>
                <Field label="Título da ficha"><input className="field" value={h.title} onChange={(e) => setHotspot(i, { title: e.target.value })} /></Field>
              </div>
              <Field label="Descrição"><textarea className="field min-h-20" value={h.description} onChange={(e) => setHotspot(i, { description: e.target.value })} /></Field>
              <Field label="Especificações (uma por linha — Rótulo: valor)"><textarea className="field min-h-20 font-mono text-xs" defaultValue={specsToText(h.specs)} onBlur={(e) => setHotspot(i, { specs: textToSpecs(e.target.value) })} /></Field>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className={`btn-ghost ${pickFor === i ? "!border-champagne !text-champagne" : ""}`} onClick={() => setPickFor(pickFor === i ? null : i)}>
                  {pickFor === i ? "Cancelar posicionamento" : "Posicionar no modelo"}
                </button>
                <button type="button" className="btn-ghost" onClick={() => { const v = preview.current?.captureCamera(); if (v) setHotspot(i, { camera: v }); }}>Usar câmera atual</button>
                <button type="button" className="btn-ghost" onClick={() => preview.current?.setCamera(h.camera)}>Ver câmera</button>
                <Check label="Verificado" checked={h.verified} onChange={(v) => setHotspot(i, { verified: v })} />
                <button type="button" className="text-xs text-red-300 underline" onClick={() => set("hotspots", p.hotspots.filter((_, j) => j !== i))}>Remover</button>
              </div>
              <p className="font-mono text-[11px] text-mute">pos [{h.position.join(", ")}] · normal [{h.normal.join(", ")}] · câmera [{h.camera.position.join(", ")}]</p>
            </div>
          ))}
          <button type="button" className="btn-ghost" onClick={() => {
            const n = p.hotspots.length + 1;
            set("hotspots", [...p.hotspots, { id: `detalhe-${n}`, label: `Detalhe ${n}`, title: `Detalhe ${n}`, description: "", specs: [], verified: false, position: [0, 0, 0], normal: [0, 0, 1], camera: p.camera.front }]);
            setPickFor(p.hotspots.length);
          }}>+ Adicionar hotspot</button>
        </Section>

        <Section title="Especificações do produto">
          <textarea className="field min-h-28 font-mono text-xs" defaultValue={specsToText(p.specs)} onBlur={(e) => set("specs", textToSpecs(e.target.value))} placeholder="Tela: 6,1 polegadas" />
        </Section>
      </div>

      <div className="lg:sticky lg:top-6 lg:h-[calc(100svh-3rem)]">
        <div className="flex h-full flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {p.colors.map((c) => (
              <button key={c.id} type="button" onClick={() => setPreviewColor(c.id)} aria-label={`Preview ${c.name}`} className={`h-7 w-7 rounded-full border-2 ${previewColor === c.id ? "border-champagne" : "border-transparent"}`} style={{ background: c.swatch }} />
            ))}
          </div>
          <div className="flex-1">
            <AdminPreview
              product={p}
              colorId={previewColor}
              pickMode={pickFor !== null}
              onMaterials={onMaterials}
              handleRef={preview}
              onPick={({ position, normal }) => {
                if (pickFor === null) return;
                const v = preview.current?.captureCamera();
                setHotspot(pickFor, { position, normal, ...(v ? { camera: v } : {}) });
                setPickFor(null);
              }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-primary" onClick={save} disabled={status?.kind === "busy"} data-testid="save">Salvar</button>
            {status && <span role="status" className={`text-sm ${status.kind === "error" ? "text-red-300" : status.kind === "ok" ? "text-champagne" : "text-mute"}`}>{status.msg}</span>}
          </div>
          {issues.length > 0 && (
            <ul className="max-h-32 overflow-y-auto rounded-xl border border-red-400/30 p-3 text-xs text-red-200">
              {issues.map((i) => <li key={i}>{i}</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.22em] text-champagne">{title}</h2>
      {children}
    </section>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-bone/85">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#cdb88f]" />
      {label}
    </label>
  );
}
function Num({ value, onChange, step = 1 }: { value: number; onChange: (v: number) => void; step?: number }) {
  return <input type="number" className="field" value={Number.isFinite(value) ? value : ""} step={step} onChange={(e) => onChange(Number(e.target.value))} />;
}
function VecInput({ value, onChange }: { value: Vec3; onChange: (v: Vec3) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {value.map((v, i) => (
        <input key={i} type="number" step={0.01} className="field" value={v} aria-label={["x", "y", "z"][i]}
          onChange={(e) => onChange(value.map((x, j) => (j === i ? Number(e.target.value) : x)) as Vec3)} />
      ))}
    </div>
  );
}
function ViewEditor({ label, value, onChange, onCapture, onPreview }: { label: string; value: CameraView; onChange: (v: CameraView) => void; onCapture: () => void; onPreview: () => void }) {
  return (
    <div className="space-y-2 rounded-xl border border-line p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-bone/85">{label}</span>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost !min-h-9 !px-3" onClick={onPreview}>Ver</button>
          <button type="button" className="btn-ghost !min-h-9 !px-3" onClick={onCapture}>Usar câmera atual</button>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div><span className="label">Posição</span><VecInput value={value.position} onChange={(position) => onChange({ ...value, position })} /></div>
        <div><span className="label">Alvo</span><VecInput value={value.target} onChange={(target) => onChange({ ...value, target })} /></div>
      </div>
    </div>
  );
}
