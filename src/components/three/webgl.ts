let cached: boolean | null = null;

/** Detecta suporte a WebGL (2 ou 1). Pode ser forçado a falso com ?nowebgl=1 para testes. */
export function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;
  if (new URLSearchParams(window.location.search).has("nowebgl")) return false;
  if (cached !== null) return cached;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    cached = !!gl;
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}

/** Limite de pixel ratio: telas densas de celular custam caro; 1.5 já fica nítido. */
export function maxDpr(): number {
  if (typeof window === "undefined") return 1;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
}
