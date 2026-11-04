"use client";
/* eslint-disable react-hooks/refs, react-hooks/immutability, react-hooks/set-state-in-effect --
 * Palco de animação do R3F: o estado da animação é um objeto mutável lido a cada quadro em
 * useFrame e escrito pelo GSAP — fora do ciclo de render do React, de propósito, para não
 * re-renderizar a árvore a 60 fps. É o padrão recomendado pelo React Three Fiber. */
import { Suspense, useEffect, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Vector3, type Group } from "three";
import type { Product } from "@/lib/schema";
import { PhoneModel } from "@/components/three/PhoneModel";
import { Studio } from "@/components/three/Studio";
import { ViewerBoundary } from "@/components/three/ViewerBoundary";
import { firstAvailableColor, storyKeys, type StoryKey } from "@/components/three/scenes";
import { hasWebGL, maxDpr } from "@/components/three/webgl";
import { useInView } from "@/hooks/useInView";

gsap.registerPlugin(ScrollTrigger);

type Live = { cx: number; cy: number; cz: number; tx: number; ty: number; tz: number; rotY: number; float: number; screen: number };
const toLive = (k: StoryKey): Live => ({
  cx: k.cam[0], cy: k.cam[1], cz: k.cam[2], tx: k.target[0], ty: k.target[1], tz: k.target[2], rotY: k.rotY, float: k.float, screen: k.screen,
});

const look = new Vector3();
function Rig({ live, model }: { live: Live; model: RefObject<Group | null> }) {
  const camera = useThree((s) => s.camera);
  useFrame(({ clock }) => {
    camera.position.set(live.cx, live.cy, live.cz);
    camera.lookAt(look.set(live.tx, live.ty, live.tz));
    const g = model.current;
    if (g) {
      g.rotation.y = live.rotY;
      g.position.y = Math.sin(clock.elapsedTime * 0.9) * 0.05 * live.float;
      g.rotation.z = Math.sin(clock.elapsedTime * 0.6) * 0.03 * live.float;
    }
  });
  return null;
}

/**
 * Canvas fixo (sticky) da seção de storytelling. A timeline do GSAP é amarrada ao scroll
 * (scrub), sem pin e sem bloquear o scroll nativo: o contêiner é sticky em CSS.
 */
export default function StoryStage({ product, sectionId, reduced }: { product: Product; sectionId: string; reduced: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const model = useRef<Group>(null);
  const inView = useInView(wrap, "100px");
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [mobile, setMobile] = useState(false);
  const [screen, setScreen] = useState(0.6);
  const live = useRef<Live>(toLive(storyKeys(product, false)[0])).current;

  useEffect(() => {
    setWebgl(hasWebGL());  
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const keys = storyKeys(product, mobile);
    if (reduced) {
      Object.assign(live, toLive(keys[3]));
      return;
    }
    Object.assign(live, toLive(keys[0]));
    const section = document.getElementById(sectionId);
    if (!section) return;
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut", duration: 1 },
      scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: mobile ? 0.4 : 0.9 },
      onUpdate: () => setScreen((v) => (Math.abs(v - live.screen) > 0.05 ? live.screen : v)),
    });
    keys.slice(1).forEach((k, i) => tl.to(live, toLive(k), i));
    // Textos de cada cena: entram e saem no trecho correspondente.
    const panels = gsap.utils.toArray<HTMLElement>(`#${sectionId} [data-scene]`);
    panels.forEach((el, i) => {
      const at = Math.max(0, i - 0.35);
      if (i > 0) tl.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, at);
      if (i < panels.length - 1) tl.to(el, { autoAlpha: 0, y: -40, duration: 0.3, ease: "power2.in" }, i + 0.35);
    });
    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [product, mobile, reduced, sectionId, live]);

  const variant = firstAvailableColor(product);
  return (
    <div ref={wrap} className="absolute inset-0" aria-hidden>
      {webgl && (
        <ViewerBoundary fallback={() => null}>
          <Canvas
            dpr={mobile ? 1 : [1, Math.min(1.5, maxDpr())]}
            frameloop={inView ? "always" : "never"}
            camera={{ position: [live.cx, live.cy, live.cz], fov: product.camera.fov, near: 0.05, far: 50 }}
            gl={{ antialias: !mobile, alpha: false, powerPreference: "high-performance" }}
            onCreated={({ gl }) => gl.setClearColor("#000000")}
            style={{ pointerEvents: "none" }}
          >
            <fog attach="fog" args={["#000000", 5, 12]} />
            <Studio shadows={!mobile} quality={mobile ? "low" : "high"} />
            <Suspense fallback={null}>
              <group ref={model}>
                <PhoneModel product={product} variant={variant} screen={screen} />
              </group>
            </Suspense>
            <Rig live={live} model={model} />
          </Canvas>
        </ViewerBoundary>
      )}
    </div>
  );
}
