export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** progress of p inside window [a, b] */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const inQuad = (t: number) => t * t;
/** bell 0→1→0 over [a,b] */
export const bell = (p: number, a: number, b: number) => Math.sin(Math.PI * seg(p, a, b));
