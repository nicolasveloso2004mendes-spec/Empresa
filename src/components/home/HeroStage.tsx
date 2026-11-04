"use client";
/* eslint-disable react-hooks/refs, react-hooks/immutability, react-hooks/set-state-in-effect --
 * Palco de animação do R3F: o estado da animação é um objeto mutável lido a cada quadro em
 * useFrame e escrito pelo GSAP — fora do ciclo de render do React, de propósito, para não
 * re-renderizar a árvore a 60 fps. É o padrão recomendado pelo React Three Fiber. */
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import gsap from "gsap";
import type { Group, PerspectiveCamera } from "three";
import type { Product } from "@/lib/schema";
import { PhoneModel } from "@/components/three/PhoneModel";
import { Studio } from "@/components/three/Studio";
import { ViewerBoundary } from "@/components/three/ViewerBoundary";
import { firstAvailableColor } from "@/components/three/scenes";
import { hasWebGL, maxDpr } from "@/components/three/webgl";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export type IntroState = { light: number; angle: number; dist: number; camY: number; modelY: number; screen: number; spin: number };
const FINAL: IntroState = { light: 1, angle: 0.42, dist: 3.9, camY: 0.25, modelY: 0, screen: 1, spin: 0 };

/**
 * Enquadramento: no desktop o aparelho fica à direita do título (deslocamento do "filme" da
 * câmera, que não altera o centro da órbita); no celular, acima do texto.
 */
function useFraming() {
  const size = useThree((st) => st.size);
  const camera = useThree((st) => st.camera) as PerspectiveCamera;
  const wide = size.width >= 1024, mid = size.width >= 768;
  const film = wide ? -8.5 : mid ? -6 : 0;
  const lookY = mid ? 0.05 : -0.62;
  useEffect(() => {
    camera.filmOffset = film;
    camera.updateProjectionMatrix();
  }, [camera, film]);
  return { lookY, distScale: mid ? 1 : 1.55 };
}

function IntroRig({ s, done, interactive }: { s: IntroState; done: boolean; interactive: boolean }) {
  const camera = useThree((st) => st.camera);
  const { lookY, distScale } = useFraming();
  const place = () => {
    const d = s.dist * distScale;
    camera.position.set(Math.sin(s.angle) * d, s.camY, Math.cos(s.angle) * d);
    camera.lookAt(0, lookY, 0);
  };
  useFrame(() => {
    if (!done) place();
  });
  // Ao concluir (inclusive ao pular), aplica a pose final antes de os controles assumirem.
  useEffect(() => {
    if (done) place();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);
  if (!done) return null;
  return (
    <OrbitControls
      makeDefault
      enabled={interactive}
      enablePan={false}
      enableZoom={false}
      enableDamping
      dampingFactor={0.07}
      rotateSpeed={0.6}
      target={[0, lookY, 0]}
      minPolarAngle={0.3 * Math.PI}
      maxPolarAngle={0.65 * Math.PI}
    />
  );
}

function Floating({ s, children, spin }: { s: IntroState; children: ReactNode; spin: boolean }) {
  const g = useRef<Group>(null);
  useFrame(({ clock }, dt) => {
    if (!g.current) return;
    g.current.position.y = s.modelY + (spin ? Math.sin(clock.elapsedTime * 0.8) * 0.03 : 0);
    if (spin) g.current.rotation.y += dt * 0.25;
    else g.current.rotation.y = s.spin;
  });
  return <group ref={g}>{children}</group>;
}

/**
 * Palco 3D da hero: o aparelho surge da escuridão enquanto a iluminação de estúdio acende
 * e a câmera faz um arco ao redor. Depois da introdução, o visitante pode girar o aparelho.
 */
export default function HeroStage({ product, skipSignal, onIntroDone, interactive }: {
  product: Product;
  skipSignal: number;
  onIntroDone: () => void;
  interactive: boolean;
}) {
  const reduced = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap, "0px");
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [done, setDone] = useState(false);
  const [, force] = useState(0);
  const s = useRef<IntroState>({ light: 0, angle: -1.25, dist: 6.4, camY: 0.9, modelY: -0.35, screen: 0, spin: -0.6 }).current;
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => setWebgl(hasWebGL()), []);  

  useEffect(() => {
    if (!webgl) return;
    const finish = () => {
      setDone(true);
      onIntroDone();
    };
    if (reduced) {
      Object.assign(s, FINAL);
      force((n) => n + 1);
      finish();
      return;
    }
    const t = gsap.timeline({ delay: 0.35, onUpdate: () => force((n) => (n + 1) % 1000), onComplete: finish });
    t.to(s, { light: 1, duration: 2.4, ease: "power2.inOut" }, 0)
      .to(s, { angle: FINAL.angle, dist: FINAL.dist, camY: FINAL.camY, duration: 3.6, ease: "power3.inOut" }, 0)
      .to(s, { modelY: 0, spin: 0, duration: 3.2, ease: "power3.out" }, 0.2)
      .to(s, { screen: 1, duration: 1.2, ease: "power1.out" }, 2.4);
    tl.current = t;
    return () => {
      t.kill();
    };
  }, [webgl, reduced, s, onIntroDone]);

  // "Pular introdução"
  useEffect(() => {
    if (skipSignal && tl.current && tl.current.progress() < 1) tl.current.progress(1);
  }, [skipSignal]);

  // Sem WebGL a introdução termina imediatamente (a página continua navegável).
  useEffect(() => {
    if (webgl === false) onIntroDone();
  }, [webgl, onIntroDone]);

  const variant = firstAvailableColor(product);
  return (
    <div ref={wrap} className="absolute inset-0" style={{ pointerEvents: done && interactive ? "auto" : "none" }} aria-hidden={!interactive}>
      {webgl && (
        <ViewerBoundary fallback={() => null}>
          <Canvas
            dpr={[1, maxDpr()]}
            frameloop={inView ? "always" : "never"}
            camera={{ position: [0, 0.9, 6.4], fov: product.camera.fov, near: 0.05, far: 50 }}
            gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
            onCreated={({ gl }) => gl.setClearColor("#000000")}
            className={interactive ? "touch-none" : ""}
            // O wrapper do R3F força pointer-events:auto; sem interação ativa, o toque
            // precisa atravessar o canvas para a página rolar normalmente no celular.
            style={{ pointerEvents: done && interactive ? "auto" : "none" }}
          >
            <fog attach="fog" args={["#000000", 4.5, 11]} />
            <Studio intensity={s.light} shadowY={-0.82} />
            <Suspense fallback={null}>
              <Floating s={s} spin={done && !reduced && !interactive}>
                <PhoneModel product={product} variant={variant} screen={s.screen} />
              </Floating>
            </Suspense>
            <IntroRig s={s} done={done} interactive={interactive} />
          </Canvas>
        </ViewerBoundary>
      )}
    </div>
  );
}
