"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type Tier = "high" | "mid" | "low";
export type DeviceInfo = {
  ready: boolean;
  webgl: boolean;
  tier: Tier;
  mobile: boolean;
  reducedMotion: boolean;
};

const initial: DeviceInfo = { ready: false, webgl: true, tier: "mid", mobile: false, reducedMotion: false };

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function detectDevice(): DeviceInfo {
  const mobile = matchMedia("(pointer: coarse)").matches || innerWidth < 768;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const forceLite = new URLSearchParams(location.search).has("lite");
  const webgl = !forceLite && hasWebGL();
  let tier: Tier = "high";
  if (mobile || cores <= 4 || mem <= 4) tier = "mid";
  if ((mobile && (cores <= 4 || mem <= 3)) || reducedMotion) tier = "low";
  return { ready: true, webgl, tier, mobile, reducedMotion };
}

export const DeviceContext = createContext<DeviceInfo>(initial);
export const useDevice = () => useContext(DeviceContext);

export function useDetectDevice() {
  const [info, setInfo] = useState<DeviceInfo>(initial);
  useEffect(() => {
    setInfo(detectDevice());
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setInfo(detectDevice());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return info;
}
