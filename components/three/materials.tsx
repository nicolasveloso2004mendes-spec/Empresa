"use client";
import { CanvasTexture } from "three";
/** Shared PBR looks of the NicoTech world. */
export const GOLD = "#D4AF37";
export const GOLD_HI = "#F2D67B";

export function Gold({ rough = 0.22 }: { rough?: number }) {
  return <meshPhysicalMaterial color={GOLD} metalness={1} roughness={rough} clearcoat={0.4} clearcoatRoughness={0.25} />;
}

export function Graphite({ rough = 0.32 }: { rough?: number }) {
  return <meshPhysicalMaterial color="#1b1b1b" metalness={0.95} roughness={rough} clearcoat={0.6} clearcoatRoughness={0.2} />;
}

export function DarkMetal({ rough = 0.45 }: { rough?: number }) {
  return <meshStandardMaterial color="#101010" metalness={0.9} roughness={rough} />;
}

let glowTex: CanvasTexture | null = null;
/** soft radial falloff used for halos (generated once, no asset) */
export function getGlowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.35)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  glowTex = new CanvasTexture(c);
  return glowTex;
}
