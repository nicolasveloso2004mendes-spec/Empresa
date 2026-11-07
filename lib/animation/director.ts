import { Vector3, Color } from "three";
import { projects } from "@/data/projects";
import { cine, SCENES } from "./store";
import { WORLD, DEVICE } from "./world";
import { seg, lerp, inOut, smooth, bell, clamp01 } from "./math";

/**
 * The Director: pure function of normalized scroll progress → a "shot".
 * Camera, key light and atmosphere for every scene are described here, in one
 * place, so the whole film can be re-timed without touching components.
 */
export type Shot = {
  pos: Vector3;
  target: Vector3;
  fov: number;
  key: Vector3;
  keyIntensity: number;
  keyColor: Color;
  exposure: number; // environment intensity
  fog: number; // fog density
  /** how quickly the camera follows (seconds to settle) */
  smoothTime: number;
};

const GOLD = new Color("#D4AF37");
const GOLD_HI = new Color("#F2D67B");
const WHITE = new Color("#F5F5F5");

const v = () => new Vector3();
const tmpA = v();
const tmpB = v();

export function createShot(): Shot {
  return {
    pos: new Vector3(0, 0, 14),
    target: new Vector3(0, 0, -10),
    fov: 35,
    key: new Vector3(0, 0, 2),
    keyIntensity: 0,
    keyColor: GOLD.clone(),
    exposure: 0,
    fog: 0.04,
    smoothTime: 0.35,
  };
}

/** distance multiplier so framing survives portrait / narrow screens */
export const framing = (aspect: number) => (aspect < 0.8 ? 1.75 : aspect < 1.25 ? 1.3 : 1);

export function direct(out: Shot, aspect: number, time: number) {
  const k = framing(aspect);
  const portrait = aspect < 0.8;
  const id = SCENES[cine.active];
  const p = cine.progress[id] ?? 0;
  out.fov = 35;
  out.smoothTime = cine.reduced ? 0.05 : 0.38;
  out.keyColor.copy(GOLD);

  if (id === "intro") {
    const a = cine.introAuto;
    const L = WORLD.logo;
    // auto approach, then scroll dolly *through* the symbol into the hero
    const zAuto = lerp(13, 8, smooth(a));
    const t = Math.pow(inOut(p), 2); // linger on the symbol, then dive through it (crosses z=0 at p≈0.51)
    out.pos.set(Math.sin(time * 0.2) * 0.08, 0.05 + lerp(0, 0.35, t), lerp(zAuto * k, -21, t));
    out.target.set(0, 0, out.pos.z - 20);
    // the small light: born in the center, then sweeps the metal
    const sweep = smooth(seg(a, 0.25, 1));
    out.key.set(lerp(0, 2.6, sweep) + Math.sin(time * 0.6) * 0.3, lerp(0, 1.6, sweep), L.z + lerp(0.8, 3, sweep));
    out.keyIntensity = lerp(0.0, 38, smooth(seg(a, 0, 0.5))) * (1 - seg(p, 0.75, 1) * 0.6);
    out.exposure = lerp(0, 0.55, smooth(seg(a, 0.3, 1))) + seg(p, 0.6, 1) * 0.15;
    out.fog = 0.035;
    out.keyColor.copy(GOLD).lerp(GOLD_HI, sweep);
    return;
  }

  if (id === "hero") {
    const H = WORLD.hero;
    const t = inOut(p);
    const ang = lerp(0, 0.85, t) + cine.pointer.x * 0.05;
    const r = 9 * k;
    out.pos.set(H.x + Math.sin(ang) * r, H.y + lerp(0.4, 1.7, t) + cine.pointer.y * 0.15, H.z + Math.cos(ang) * r);
    // keep the sculpture right of the headline on desktop, low-center on portrait
    const off = portrait ? new Vector3(0, 1.6, 0) : new Vector3(-2.3 * (1 - t * 0.4), 0, 0);
    out.target.copy(H).add(off.applyAxisAngle(tmpA.set(0, 1, 0), ang));
    out.key.set(H.x + Math.cos(time * 0.4) * 5, H.y + 3.5, H.z + Math.sin(time * 0.4) * 5);
    out.keyIntensity = 55;
    out.exposure = 0.7;
    out.fog = 0.03;
    return;
  }

  if (id === "manifesto") {
    const H = WORLD.hero;
    const back = smooth(seg(p, 0, 0.2));
    const fly = inOut(seg(p, 0.2, 1));
    // 1) pull away from the sculpture, 2) travel forward through the shard field
    const startAng = 0.85;
    const r = 9 * k;
    tmpA.set(H.x + Math.sin(startAng) * r, H.y + 1.7, H.z + Math.cos(startAng) * r);
    tmpB.set(H.x + 4.5, H.y + 3.2, H.z + 20 * k);
    out.pos.lerpVectors(tmpA, tmpB, back);
    if (fly > 0) {
      out.pos.set(lerp(tmpB.x, 0, fly), lerp(tmpB.y, 0.6, fly), lerp(tmpB.z, WORLD.manifesto.to, fly));
    }
    out.pos.x += Math.sin(time * 0.3) * 0.25;
    out.target.set(out.pos.x * 0.6, out.pos.y - 0.3, out.pos.z - 14);
    if (back < 1) out.target.lerpVectors(H, out.target, back);
    out.key.set(out.pos.x, out.pos.y + 4, out.pos.z - 8);
    out.keyIntensity = lerp(40, 10, back);
    out.exposure = lerp(0.6, 0.18, back);
    out.fog = lerp(0.03, 0.06, back);
    out.keyColor.copy(GOLD).lerp(WHITE, 0.2);
    return;
  }

  if (id.startsWith("work-")) {
    const slug = id.slice(5);
    const i = projects.findIndex((x) => x.slug === slug);
    const L = WORLD.work(i);
    const focus = cine.device[slug] ?? "auto";
    workShot(out, L, p, focus, aspect, k, time);
    out.key.set(L.x - 3 + Math.sin(time * 0.5) * 2, L.y + 4.5, L.z + 3.5);
    out.keyIntensity = 45;
    out.exposure = 0.6;
    out.fog = 0.028;
    return;
  }

  if (id === "capabilities") {
    const C = WORLD.caps;
    const n = 5; // 6 stops → 5 travels
    const s = clamp01(p) * n;
    const idx = Math.min(Math.floor(s), n - 1);
    const f = s - idx;
    const stop = p >= 1 ? n : idx + smooth(seg(f, 0.55, 1));
    const x = C.x + stop * WORLD.capsSpacing;
    const drift = (f - 0.5) * 1.6; // gentle parallax while holding
    out.pos.set(x + drift - (portrait ? 0 : 2.4), C.y + 0.9, C.z + 9.5 * k);
    out.target.set(x - (portrait ? 0 : 2.4) + drift * 0.3, C.y + (portrait ? 1.4 : 0), C.z);
    out.key.set(x + 3, C.y + 4, C.z + 4);
    out.keyIntensity = 50;
    out.exposure = 0.55;
    out.fog = 0.03;
    return;
  }

  if (id === "lab") {
    const B = WORLD.lab;
    out.pos.set(B.x + Math.sin(time * 0.05) * 3, B.y + 2 - p * 3, B.z + 14 - p * 10);
    out.target.set(B.x, B.y - 4, B.z - 10);
    out.key.set(B.x, B.y + 3, B.z);
    out.keyIntensity = 15;
    out.exposure = 0.2;
    out.fog = 0.05;
    return;
  }

  // final: darkness, then the gold light reveals the mark again
  const F = WORLD.final;
  const t = inOut(p);
  out.pos.set(Math.sin(time * 0.15) * 0.15, F.y + 0.1, F.z + lerp(16, 8.5, t) * k);
  out.target.set(0, F.y + (portrait ? -0.6 : 0.1), F.z);
  const rise = smooth(seg(p, 0.0, 0.4));
  out.key.set(Math.sin(time * 0.5) * 2.2, lerp(-3, 1.8, rise), F.z + 3);
  out.keyIntensity = lerp(0, 42, rise) + bell(p, 0.5, 0.9) * 8;
  out.exposure = lerp(0.05, 0.5, rise);
  out.fog = 0.04;
}

const pose = v();
const look = v();
function workShot(out: Shot, L: Vector3, p: number, focus: string, aspect: number, k: number, time: number) {
  const screen = tmpA.copy(DEVICE.screenCenter).add(L);
  const phone = tmpB.copy(DEVICE.phone).add(L).add(look.set(0, DEVICE.phoneH / 2, 0));

  // distance at which the laptop screen fills the viewport
  const vfov = (35 * Math.PI) / 180;
  const fillH = DEVICE.screenH / (2 * Math.tan(vfov / 2));
  const fillW = DEVICE.screenW / (2 * Math.tan(vfov / 2) * aspect);
  const fill = Math.max(fillH, fillW) * 0.97;
  const phoneFill = Math.max(DEVICE.phoneH / (2 * Math.tan(vfov / 2)), DEVICE.phoneW / (2 * Math.tan(vfov / 2) * aspect)) * 1.25;

  if (focus === "desktop") {
    out.pos.copy(screen).addScaledVector(DEVICE.screenNormal, fill * 1.08);
    out.target.copy(screen);
    return;
  }
  if (focus === "mobile") {
    out.pos.copy(phone).add(pose.set(-0.35, 0.05, phoneFill));
    out.target.copy(phone);
    return;
  }

  const front = look.set(L.x, L.y + 0.7, L.z);
  if (p < 0.25) {
    // approach: the laptop opens as we arrive
    const t = inOut(seg(p, 0, 0.25));
    out.pos.set(L.x, L.y + lerp(2.4, 1.3, t), L.z + lerp(17, 6.4, t) * k);
    out.target.copy(front);
  } else if (p < 0.5) {
    // orbit to reveal the client name
    const t = inOut(seg(p, 0.25, 0.5));
    const ang = lerp(0, 0.78, t);
    const r = 6.4 * k;
    out.pos.set(L.x + Math.sin(ang) * r, L.y + 1.3 + t * 0.4, L.z + Math.cos(ang) * r);
    out.target.copy(front).x += lerp(0, -1.2, t) * (aspect > 1 ? 1 : 0);
  } else if (p < 0.78) {
    // swing back and push into the screen until the site owns the viewport
    const t = inOut(seg(p, 0.5, 0.72));
    const ang = lerp(0.78, 0, t);
    const r = 6.4 * k;
    pose.set(L.x + Math.sin(ang) * r, L.y + 1.7, L.z + Math.cos(ang) * r);
    out.pos.copy(pose).lerp(look.copy(screen).addScaledVector(DEVICE.screenNormal, fill), t);
    out.target.copy(front).lerp(screen, t);
  } else {
    // pull back, the phone with the mobile version enters
    const t = inOut(seg(p, 0.78, 1));
    pose.copy(screen).addScaledVector(DEVICE.screenNormal, fill);
    look.copy(phone).add(tmpA.set(-1.1, 0.25, 4.6 * k));
    out.pos.lerpVectors(pose, look, t);
    out.target.lerpVectors(screen.copy(DEVICE.screenCenter).add(L), phone, t);
  }
  out.pos.y += Math.sin(time * 0.6) * 0.02;
}
