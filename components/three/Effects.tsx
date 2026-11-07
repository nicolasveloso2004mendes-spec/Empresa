"use client";
import { useEffect, useRef } from "react";
import { EffectComposer, Bloom, Vignette, Noise, DepthOfField } from "@react-three/postprocessing";
import { BlendFunction, type DepthOfFieldEffect } from "postprocessing";
import type { Tier } from "@/hooks/useDeviceTier";
import { focusTarget } from "./DirectorRig";

/** Lens: bloom on the gold, subtle depth of field on the director's focus point, grain, vignette. */
export function Effects({ dof, tier }: { dof: boolean; tier: Tier }) {
  const dofRef = useRef<DepthOfFieldEffect>(null);
  useEffect(() => {
    if (dofRef.current) dofRef.current.target = focusTarget; // follow what the camera looks at
  }, [dof]);
  return (
    <EffectComposer multisampling={tier === "high" ? 4 : 0} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.82} luminanceSmoothing={0.2} radius={0.7} />
      {dof ? <DepthOfField ref={dofRef} target={[0, 0, 0]} worldFocusRange={9} bokehScale={2.2} focalLength={0.05} /> : <></>}
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.12} />
      <Vignette eskil={false} offset={0.22} darkness={0.82} />
    </EffectComposer>
  );
}
