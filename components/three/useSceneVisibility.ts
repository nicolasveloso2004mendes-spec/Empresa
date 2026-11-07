"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Object3D } from "three";
import { cine, SCENES } from "@/lib/animation/store";

/**
 * Hides a group unless one of its scenes is the active one or a neighbour —
 * cuts draw calls without visible popping (neighbours stay ready).
 */
export function useSceneVisibility<T extends Object3D>(ids: string[], spread = 1) {
  const ref = useRef<T>(null);
  const idx = ids.map((id) => SCENES.indexOf(id as (typeof SCENES)[number]));
  useFrame(() => {
    if (!ref.current) return;
    ref.current.visible = idx.some((i) => Math.abs(i - cine.active) <= spread);
  });
  return ref;
}
