"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect } from "react";
import { DeviceContext, useDetectDevice } from "@/hooks/useDeviceTier";
import { cine } from "@/lib/animation/store";
import { gsap, ScrollTrigger, scrollToScene } from "@/lib/animation/gsap";
import { projects } from "@/data/projects";
import { SmoothScroll } from "./SmoothScroll";
import { Header } from "./Header";
import { Hud } from "./Hud";
import { Loader } from "./Loader";
import { IntroScene } from "@/components/scenes/IntroScene";
import { HeroScene } from "@/components/scenes/HeroScene";
import { ManifestoScene } from "@/components/scenes/ManifestoScene";
import { WorkScene } from "@/components/scenes/WorkScene";
import { CapabilitiesScene } from "@/components/scenes/CapabilitiesScene";
import { LabScene } from "@/components/scenes/LabScene";
import { FinalScene } from "@/components/scenes/FinalScene";
import { Footer } from "@/components/scenes/Footer";

// WebGL is client-only and split into its own chunk
const Stage = dynamic(() => import("@/components/three/Stage"), { ssr: false });

export function Experience() {
  const device = useDetectDevice();
  const use3D = device.ready && device.webgl;

  useEffect(() => {
    cine.reduced = device.reducedMotion;
  }, [device.reducedMotion]);

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const onMove = (e: PointerEvent) => {
      cine.pointer.x = (e.clientX / innerWidth) * 2 - 1;
      cine.pointer.y = -((e.clientY / innerHeight) * 2 - 1);
    };
    addEventListener("pointermove", onMove, { passive: true });
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => removeEventListener("pointermove", onMove);
  }, []);

  /** black screen → a small gold light is born → the symbol is revealed */
  const startIntro = useCallback(() => {
    // deep links (e.g. "Voltar ao showcase" → /#work-wr-car) land on that scene
    const hash = decodeURIComponent(location.hash.slice(1));
    if (hash && document.getElementById(hash)) {
      cine.introAuto = 1;
      ScrollTrigger.refresh();
      requestAnimationFrame(() => scrollToScene(hash, hash.startsWith("work-") ? 0.3 : 0.02));
      return;
    }
    if (cine.reduced) {
      cine.introAuto = 1;
      return;
    }
    gsap.fromTo(cine, { introAuto: 0 }, { introAuto: 1, duration: 4.2, ease: "power2.inOut", delay: 0.2 });
  }, []);

  return (
    <DeviceContext.Provider value={device}>
      <SmoothScroll enabled={device.ready && !device.reducedMotion} />
      {use3D ? <Stage tier={device.tier} /> : <div className="static-stage fixed inset-0" aria-hidden="true" />}
      <Loader use3D={use3D} ready={device.ready} onDone={startIntro} />
      <Header />
      <Hud />
      <main id="conteudo" className="relative z-10 overflow-x-clip">
        <IntroScene />
        <HeroScene />
        <ManifestoScene />
        <div id="work">
          {projects.map((p, i) => (
            <WorkScene key={p.slug} project={p} index={i} total={projects.length} />
          ))}
        </div>
        <CapabilitiesScene />
        <LabScene />
        <FinalScene />
      </main>
      <Footer />
    </DeviceContext.Provider>
  );
}
