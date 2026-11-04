"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import styles from "./PackagingBox3D.module.css";
import { StaticBoxFallback } from "./StaticBoxFallback";

export type PackagingBox3DProps = {
  /** Conteúdo impresso na face frontal. */
  frontPrint?: ReactNode;
  /** Conteúdo impresso na lateral direita. */
  sidePrint?: ReactNode;
  initialRotation?: number;
  initialTilt?: number;
  /** Abre as abas automaticamente uma única vez quando a caixa entra na tela. */
  autoOpen?: boolean;
  /** Largura de referência (px) do objeto aberto; usada para ajustar a escala. */
  footprint?: number;
  className?: string;
  label?: string;
};

const wrap = (n: number) => (((n + 180) % 360) + 360) % 360 - 180;
const ENTRANCE_MS = 850;
const DRAG_FACTOR = 0.6;

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getReducedMotion = () => window.matchMedia(REDUCED_QUERY).matches;
const noopSubscribe = () => () => {};
const getSupports3d = () =>
  typeof CSS !== "undefined" &&
  CSS.supports("transform-style", "preserve-3d") &&
  CSS.supports("perspective", "1px");

export function PackagingBox3D({
  frontPrint,
  sidePrint,
  initialRotation = -28,
  initialTilt = -22,
  autoOpen = true,
  footprint = 560,
  className,
  label = "Caixa de papelão em 3D",
}: PackagingBox3DProps) {
  const uid = useId();
  const hintId = `${uid}-hint`;
  const angleId = `${uid}-angle`;

  const stageRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; r: number; id: number } | null>(null);

  const [rotation, setRotation] = useState(initialRotation);
  const [tilt] = useState(initialTilt);
  /** null = fase de introdução (fechada), antes de qualquer abertura. */
  const [open, setOpen] = useState<boolean | null>(null);
  const [status, setStatus] = useState("");
  const [dragging, setDragging] = useState(false);
  const [inView, setInView] = useState(false);
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
  const supports3d = useSyncExternalStore(noopSubscribe, getSupports3d, () => true);
  const [scale, setScale] = useState<number | null>(null);

  // Com movimento reduzido, a introdução já mostra a caixa aberta, sem animação.
  const isOpen = open ?? reduced;

  // Visibilidade da área: pausa comportamentos automáticos fora da tela.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.35,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Escala responsiva para as abas abertas caberem na largura disponível.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setScale(Math.min(1, Math.max(0.45, (w - 16) / footprint)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [footprint]);

  // Abertura automática única, só depois da entrada e com a caixa visível.
  useEffect(() => {
    if (!autoOpen || reduced || open !== null || !inView) return;
    const t = window.setTimeout(() => setOpen(true), ENTRANCE_MS + 150);
    return () => window.clearTimeout(t);
  }, [autoOpen, reduced, open, inView]);

  // Reação discreta ao cursor (desktop), em camada separada da rotação manual.
  useEffect(() => {
    const layer = parallaxRef.current;
    const stage = stageRef.current;
    if (!layer || !stage) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine || reduced || !inView || !supports3d) {
      layer.style.transform = "";
      return;
    }
    let frame = 0;
    let nx = 0;
    let ny = 0;
    const applyFrame = () => {
      frame = 0;
      layer.style.transform = `rotateX(${(-ny * 3).toFixed(2)}deg) rotateY(${(nx * 4).toFixed(2)}deg)`;
    };
    const onMove = (e: globalThis.PointerEvent) => {
      if (dragRef.current || e.pointerType !== "mouse") return;
      const r = stage.getBoundingClientRect();
      nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 0.9)));
      ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 1.2)));
      if (!frame) frame = requestAnimationFrame(applyFrame);
    };
    const onLeave = () => {
      nx = 0;
      ny = 0;
      if (!frame) frame = requestAnimationFrame(applyFrame);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
      layer.style.transform = "";
    };
  }, [reduced, inView, supports3d]);

  // Encerra o arraste mesmo se o ponteiro for solto fora da área.
  useEffect(() => {
    const end = () => {
      dragRef.current = null;
      setDragging(false);
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("blur", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("blur", end);
    };
  }, []);

  const toggle = useCallback(() => {
    const next = !isOpen;
    setOpen(next);
    setStatus(next ? "Caixa aberta" : "Caixa fechada");
  }, [isOpen]);

  const reset = useCallback(() => {
    setRotation(initialRotation);
    setStatus("Vista inicial restaurada");
  }, [initialRotation]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragRef.current = { x: e.clientX, r: rotation, id: e.pointerId };
    setDragging(true);
    if (e.pointerType === "mouse") e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    setRotation(wrap(d.r + (e.clientX - d.x) * DRAG_FACTOR));
  };
  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 45 : 10;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      setRotation((r) => wrap(r + (e.key === "ArrowLeft" ? -step : step)));
    } else if (e.key === "Home") {
      e.preventDefault();
      reset();
    }
  };

  const rounded = Math.round(rotation);
  const degreeText = `${rounded < 0 ? "−" : ""}${Math.abs(rounded)}°`;

  const rootClass = [
    styles.root,
    open === null ? styles.intro : "",
    isOpen ? "" : styles.closed,
    dragging ? styles.dragging : "",
    supports3d ? "" : styles.no3d,
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClass}
      style={scale !== null ? ({ "--box-scale": scale } as React.CSSProperties) : undefined}
    >
      <div
        ref={stageRef}
        className={styles.stage}
        tabIndex={supports3d ? 0 : -1}
        role="group"
        aria-roledescription="visualizador 3D"
        aria-label={`${label}. ${isOpen ? "Aberta" : "Fechada"}, rotação ${degreeText}.`}
        aria-describedby={hintId}
        onPointerDown={supports3d ? onPointerDown : undefined}
        onPointerMove={supports3d ? onPointerMove : undefined}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onKeyDown={supports3d ? onKeyDown : undefined}
      >
        <div className={styles.view} aria-hidden="true">
          <div className={styles.shadow} />
          <div ref={parallaxRef} className={styles.parallax}>
            <div className={styles.sizer}>
              <div
                className={styles.scene}
                style={{ transform: `rotateX(${tilt}deg) rotateY(${rotation}deg)` }}
              >
                <div className={`${styles.face} ${styles.bottom}`} />
                <div className={`${styles.face} ${styles.back}`} />
                <div className={`${styles.face} ${styles.left}`} />
                <div className={`${styles.face} ${styles.right}`}>
                  {sidePrint && <div className={styles.print}>{sidePrint}</div>}
                </div>
                <div className={`${styles.face} ${styles.front}`}>
                  {frontPrint && <div className={styles.print}>{frontPrint}</div>}
                </div>
                <div className={`${styles.hinge} ${styles.hb}`}>
                  <div className={`${styles.flap} ${styles.major}`} />
                </div>
                <div className={`${styles.hinge} ${styles.hl}`}>
                  <div className={`${styles.flap} ${styles.minor}`} />
                </div>
                <div className={`${styles.hinge} ${styles.hr}`}>
                  <div className={`${styles.flap} ${styles.minor}`} />
                </div>
                <div className={`${styles.hinge} ${styles.hf}`}>
                  <div className={`${styles.flap} ${styles.major}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <StaticBoxFallback className={styles.fallback} />
      </div>

      <p id={hintId} className={styles.hint}>
        {supports3d
          ? "Arraste na horizontal ou use as setas do teclado para girar."
          : "Ilustração estática: seu navegador não exibe a caixa em 3D."}
      </p>

      {supports3d && (
        <div className={styles.controls}>
          <button type="button" className={styles.control} onClick={toggle}>
            {isOpen ? "Fechar caixa" : "Abrir caixa"}
          </button>
          <button type="button" className={styles.control} onClick={reset}>
            Restaurar vista
          </button>
          <label className={styles.range} htmlFor={angleId}>
            <span className={styles.rangeLabel}>Girar</span>
            <input
              id={angleId}
              type="range"
              min={-180}
              max={180}
              step={1}
              value={rounded}
              aria-valuetext={`${rounded} graus`}
              onChange={(e) => setRotation(Number(e.target.value))}
            />
            <output htmlFor={angleId} className={styles.degrees}>
              {degreeText}
            </output>
          </label>
        </div>
      )}
      <p className={styles.srOnly} aria-live="polite">
        {status}
      </p>
    </div>
  );
}
