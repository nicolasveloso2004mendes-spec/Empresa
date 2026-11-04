"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor, useGLTF } from "@react-three/drei";
import { MeshStandardMaterial, SpotLight, Vector3, type Group } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CameraView, ColorVariant, Hotspot, Product } from "@/lib/schema";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CameraRig, type CameraGoal } from "./CameraRig";
import { Hotspots } from "./Hotspots";
import { PhoneModel } from "./PhoneModel";
import { Studio } from "./Studio";
import { ViewerBoundary } from "./ViewerBoundary";
import { ViewerLoader } from "./Loader";
import { ViewerFallback } from "./Fallback";
import { hasWebGL, maxDpr } from "./webgl";

export type ViewName = "initial" | "front" | "back" | "side";

export type Product3DViewerProps = {
  product: Product;
  /** Variante de cor selecionada (controlada pelo painel). */
  colorId: string;
  activeHotspotId?: string | null;
  onHotspotChange?: (id: string | null) => void;
  /** Mostra a ficha técnica do hotspot dentro do visualizador. */
  showSheet?: boolean;
  className?: string;
  /** Altura mínima ocupada (o componente preenche o contêiner). */
  autoRotateDefault?: boolean;
};

const wpos = new Vector3();

/** Luz de destaque que acompanha o hotspot em foco. */
function FocusLight({ hotspot, groupRef }: { hotspot: Hotspot | null; groupRef: RefObject<Group | null> }) {
  const light = useRef<SpotLight>(null);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const l = light.current;
    if (!l) return;
    scene.add(l.target);
    return () => {
      scene.remove(l.target);
    };
  }, [scene]);
  useFrame((_, dt) => {
    const l = light.current, g = groupRef.current;
    if (!l) return;
    const goal = hotspot ? 2.2 : 0;
    l.intensity += (goal - l.intensity) * Math.min(1, dt * 3);
    if (hotspot && g) {
      wpos.set(...hotspot.position);
      g.localToWorld(wpos);
      l.target.position.copy(wpos);
      l.position.set(...hotspot.camera.position);
    }
  });
  return <spotLight ref={light} angle={0.32} penumbra={1} distance={6} decay={1.6} intensity={0} color="#fff3dc" />;
}

/** Ponte de depuração/testes: expõe o estado da câmera e dos materiais (somente com ?debug3d). */
function DebugBridge({ controls, materials, colorId, focused }: {
  controls: RefObject<OrbitControlsImpl | null>;
  materials: RefObject<Map<string, MeshStandardMaterial> | null>;
  colorId: string;
  focused: string | null;
}) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    if (!new URLSearchParams(location.search).has("debug3d")) return;
    (window as unknown as Record<string, unknown>).__bbmViewer = {
      camera: () => camera.position.toArray(),
      target: () => controls.current?.target.toArray(),
      distance: () => controls.current ? camera.position.distanceTo(controls.current.target) : null,
      material: (n: string) => materials.current?.get(n)?.color.getHexString(),
      materialInfo: (n: string) => { const m = materials.current?.get(n); return m && { emissive: m.emissive.getHexString(), ei: m.emissiveIntensity, map: !!m.emissiveMap, type: m.type }; },
      materials: () => [...(materials.current?.keys() ?? [])],
      setCamera: (pos: [number, number, number], target: [number, number, number]) => {
        camera.position.set(...pos);
        controls.current?.target.set(...target);
        controls.current?.update();
      },
      colorId,
      focused,
      dpr: gl.getPixelRatio(),
    };
  });
  return null;
}

export function Product3DViewer({
  product,
  colorId,
  activeHotspotId,
  onHotspotChange,
  showSheet = true,
  className = "",
  autoRotateDefault = true,
}: Product3DViewerProps) {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [autoRotate, setAutoRotate] = useState(autoRotateDefault);
  const [fullscreen, setFullscreen] = useState<"none" | "native" | "css">("none");
  const [dpr, setDpr] = useState(1);
  const [contextLost, setContextLost] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [internalHotspot, setInternalHotspot] = useState<string | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const groupRef = useRef<Group | null>(null);
  const materialsRef = useRef<Map<string, MeshStandardMaterial> | null>(null);

  const hotspotId = activeHotspotId !== undefined ? activeHotspotId : internalHotspot;
  const hotspot = useMemo(() => product.hotspots.find((h) => h.id === hotspotId) ?? null, [product.hotspots, hotspotId]);

  const variant: ColorVariant = useMemo(
    () => product.colors.find((c) => c.id === colorId) ?? product.colors.find((c) => c.available) ?? product.colors[0],
    [product.colors, colorId],
  );

  const [goal, setGoal] = useState<CameraGoal>({ view: product.camera.initial, nonce: 0 });
  const flyTo = useCallback((view: CameraView, focus = false) => setGoal((g) => ({ view, focus, nonce: g.nonce + 1 })), []);

  // Selecionar hotspot → câmera voa até o detalhe; desmarcar → volta à visão completa.
  const setHotspotId = useCallback(
    (id: string | null, returnToInitial = true) => {
      const h = id ? product.hotspots.find((x) => x.id === id) : null;
      if (h) flyTo(h.camera, true);
      else if (returnToInitial) flyTo(product.camera.initial);
      setInternalHotspot(id);
      onHotspotChange?.(id);
    },
    [onHotspotChange, product.hotspots, product.camera.initial, flyTo],
  );

  useEffect(() => {
    // Detecção no cliente (não existe WebGL no servidor).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebgl(hasWebGL());
    setDpr(Math.min(1.25, maxDpr()));
  }, []);

  useEffect(() => {
    if (reduced) setAutoRotate(false); // eslint-disable-line react-hooks/set-state-in-effect
  }, [reduced]);

  const goView = (v: ViewName) => {
    if (hotspotId) setHotspotId(null, false);
    flyTo(product.camera[v]);
  };

  // Tela cheia: API nativa quando disponível; senão (iPhone) um modo CSS equivalente.
  const toggleFullscreen = async () => {
    const el = wrapRef.current;
    if (!el) return;
    if (fullscreen !== "none") {
      setFullscreen("none");
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined);
      return;
    }
    if (el.requestFullscreen && document.fullscreenEnabled) {
      try {
        // Alguns navegadores embutidos nunca resolvem a promessa: limite de 1 s.
        await Promise.race([el.requestFullscreen(), new Promise((r) => setTimeout(r, 1000))]);
      } catch {
        /* cai para o modo CSS */
      }
      if (document.fullscreenElement === el) return;
    }
    setFullscreen("css");
  };
  useEffect(() => {
    // Só sincroniza com o modo nativo; não desfaz o modo CSS (fallback) por engano.
    const onChange = () =>
      setFullscreen((prev) => (document.fullscreenElement === wrapRef.current ? "native" : prev === "native" ? "none" : prev));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  useEffect(() => {
    if (fullscreen !== "css") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFullscreen("none");
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [fullscreen]);

  const modelUrl = variant.modelUrl ?? product.model.url;
  const retry = () => {
    useGLTF.clear(modelUrl);
    setContextLost(false);
    setRetryKey((k) => k + 1);
  };

  const onMaterials = useCallback((m: Map<string, MeshStandardMaterial>) => {
    materialsRef.current = m;
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`viewer relative isolate overflow-hidden bg-black ${fullscreen === "css" ? "!fixed inset-0 z-[100]" : ""} ${className}`}
      data-testid="product-3d-viewer"
      aria-label={`Visualizador 3D: ${product.name}`}
      role="region"
    >
      {webgl === false && <ViewerFallback product={product} reason="nowebgl" />}

      {webgl && (
        <ViewerBoundary
          resetKey={`${modelUrl}-${retryKey}`}
          fallback={(_, reset) => (
            <ViewerFallback product={product} reason="error" onRetry={() => { retry(); reset(); }} />
          )}
        >
          {contextLost ? (
            <ViewerFallback product={product} reason="error" onRetry={retry} />
          ) : (
            <>
              <Canvas
                key={retryKey}
                className="!absolute inset-0 touch-none"
                dpr={dpr}
                frameloop={inView || fullscreen !== "none" ? "always" : "never"}
                camera={{ position: product.camera.initial.position, fov: product.camera.fov, near: 0.05, far: 50 }}
                gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
                onCreated={({ gl }) => {
                  gl.setClearColor("#000000");
                  gl.domElement.addEventListener("webglcontextlost", (e) => {
                    e.preventDefault();
                    setContextLost(true);
                  });
                }}
                onPointerMissed={() => hotspotId && setHotspotId(null)}
              >
                {/* Resolução adaptativa: reduz o pixel ratio se o FPS cair e sobe quando sobra folga. */}
                <PerformanceMonitor
                  bounds={() => [45, 58]}
                  onDecline={() => setDpr((d) => Math.max(0.75, +(d - 0.25).toFixed(2)))}
                  onIncline={() => setDpr((d) => Math.min(maxDpr(), +(d + 0.25).toFixed(2)))}
                  flipflops={4}
                />
                <fog attach="fog" args={["#000000", 6, 14]} />
                <Studio shadowY={-0.8 * (product.model.scale / 10) + product.model.position[1]} />
                <Suspense fallback={null}>
                  <PhoneModel product={product} variant={variant} instant={reduced} groupRef={groupRef} onMaterials={onMaterials}>
                    <Hotspots hotspots={product.hotspots} activeId={hotspotId} onSelect={(h) => setHotspotId(h.id === hotspotId ? null : h.id)} visible />
                  </PhoneModel>
                </Suspense>
                <FocusLight hotspot={hotspot} groupRef={groupRef} />
                <CameraRig
                  product={product}
                  goal={goal}
                  autoRotate={autoRotate && !reduced}
                  interactive
                  zoom
                  instant={reduced}
                  controlsRef={controlsRef}
                />
                <DebugBridge controls={controlsRef} materials={materialsRef} colorId={variant.id} focused={hotspotId} />
              </Canvas>
              <ViewerLoader />
            </>
          )}
        </ViewerBoundary>
      )}

      {/* Selo de transparência */}
      {product.demo && (
        <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-full border border-champagne/40 bg-black/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-champagne backdrop-blur">
          Modelo 3D demonstrativo
        </div>
      )}

      {/* Barra de controles */}
      <div className="absolute right-3 top-3 z-20 flex flex-col gap-2" role="toolbar" aria-label="Controles do visualizador">
        <ToolButton label="Restaurar visualização" onClick={() => goView("initial")} testId="btn-reset">
          <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
        </ToolButton>
        <ToolButton label={fullscreen !== "none" ? "Sair da tela cheia" : "Tela cheia"} onClick={toggleFullscreen} pressed={fullscreen !== "none"} testId="btn-fullscreen">
          {fullscreen !== "none" ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
        </ToolButton>
        <ToolButton
          label={autoRotate ? "Pausar rotação automática" : "Ativar rotação automática"}
          onClick={() => setAutoRotate((v) => !v)}
          pressed={autoRotate}
          testId="btn-autorotate"
          disabled={webgl === false}
        >
          {autoRotate ? <path d="M9 6v12M15 6v12" /> : <path d="M12 3a9 9 0 1 1-8.5 6M3.5 3v6h6" />}
        </ToolButton>
      </div>

      {/* Vistas rápidas */}
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1 rounded-full border border-white/10 bg-black/60 p-1 backdrop-blur" role="group" aria-label="Vistas">
        {(
          [
            ["front", "Frente"],
            ["back", "Traseira"],
            ["side", "Lateral"],
          ] as const
        ).map(([v, label]) => (
          <button key={v} type="button" className="view-chip" onClick={() => goView(v)} data-testid={`view-${v}`} disabled={webgl === false}>
            {label}
          </button>
        ))}
      </div>

      {/* Lista acessível de hotspots (teclado / leitores de tela) */}
      {product.hotspots.length > 0 && webgl !== false && (
        <div className="absolute bottom-16 left-0 right-0 z-20 flex justify-center px-3 md:bottom-auto md:left-3 md:right-auto md:top-14 md:flex-col md:justify-start" >
          <div className="no-scrollbar flex max-w-full gap-1.5 overflow-x-auto md:flex-col" role="group" aria-label="Detalhes do aparelho">
            {product.hotspots.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setHotspotId(h.id === hotspotId ? null : h.id)}
                aria-pressed={h.id === hotspotId}
                className="hotspot-chip"
                data-testid={`chip-${h.id}`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showSheet && hotspot && (
        <HotspotSheet hotspot={hotspot} onClose={() => setHotspotId(null)} />
      )}

      {fullscreen === "css" && <span className="sr-only">Pressione Esc para sair da tela cheia</span>}
    </div>
  );
}

function ToolButton({
  label, onClick, children, pressed, testId, disabled,
}: { label: string; onClick: () => void; children: ReactNode; pressed?: boolean; testId?: string; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} aria-pressed={pressed} className="tool-btn" data-testid={testId} disabled={disabled}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </button>
  );
}

export function HotspotSheet({ hotspot, onClose }: { hotspot: Hotspot; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hotspot.id, onClose]);
  return (
    <aside
      className="sheet-in absolute inset-x-3 bottom-28 z-30 max-h-[40%] overflow-y-auto rounded-2xl border border-white/10 bg-[#0b0b0c]/90 p-5 backdrop-blur-xl md:inset-x-auto md:bottom-auto md:right-16 md:top-1/2 md:max-h-[80%] md:w-[320px] md:-translate-y-1/2"
      aria-label={`Ficha técnica: ${hotspot.title}`}
      data-testid="hotspot-sheet"
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-champagne">Detalhe</div>
      <h3 className="mt-1 font-display text-lg uppercase tracking-wide text-white">{hotspot.title}</h3>
      {!hotspot.verified && (
        <p className="mt-2 inline-flex rounded-full border border-white/15 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/60">
          Dados demonstrativos — não verificados
        </p>
      )}
      <p className="mt-3 text-sm leading-relaxed text-white/70">{hotspot.description}</p>
      {hotspot.specs.length > 0 && (
        <dl className="mt-4 divide-y divide-white/10 border-y border-white/10 text-sm">
          {hotspot.specs.map((s) => (
            <div key={s.label} className="flex justify-between gap-4 py-2">
              <dt className="text-white/50">{s.label}</dt>
              <dd className="text-right text-white/90">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <button ref={closeRef} type="button" onClick={onClose} className="btn-ghost mt-5 w-full" data-testid="sheet-close">
        Voltar à visualização completa
      </button>
    </aside>
  );
}

export default Product3DViewer;
