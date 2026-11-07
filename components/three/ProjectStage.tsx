"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";
import { SRGBColorSpace, type Group, type MeshBasicMaterial, type Texture, Color } from "three";
import type { Project } from "@/data/projects";
import { cine } from "@/lib/animation/store";
import { WORLD, DEVICE } from "@/lib/animation/world";
import { seg, smooth, inOut, lerp } from "@/lib/animation/math";
import { useSceneVisibility } from "./useSceneVisibility";
import { Gold, Graphite, DarkMetal, GOLD, getGlowTexture } from "./materials";

function prepare(tex: Texture, viewRatio: number, aniso: number) {
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = aniso;
  tex.repeat.set(1, viewRatio);
  tex.offset.set(0, 1 - viewRatio);
  tex.needsUpdate = true;
}

/** set texture so `s` (0..1) scrolls from the top to the bottom of the real page */
function scrollTex(tex: Texture, s: number) {
  const r = tex.repeat.y;
  tex.offset.y = 1 - r - s * (1 - r);
}

/**
 * One exclusive set per project: laptop (desktop capture, real long-page
 * scroll on its screen) + phone (mobile capture), choreographed by scroll.
 */
export function ProjectStage({ project, index }: { project: Project; index: number }) {
  const id = `work-${project.slug}`;
  const root = useSceneVisibility<Group>([id], 1);
  const lid = useRef<Group>(null);
  const phone = useRef<Group>(null);
  const halo = useRef<MeshBasicMaterial>(null);
  const gl = useThree((s) => s.gl);
  const [desk, mob] = useTexture([project.media.desktopFull, project.media.mobileFull]);

  const deskRatio = 1 / (DEVICE.screenW / DEVICE.screenH) / project.media.desktopFullRatio;
  const mobRatio = 1 / (DEVICE.phoneW / DEVICE.phoneH) / project.media.mobileFullRatio;
  useLayoutEffect(() => {
    const a = Math.min(8, gl.capabilities.getMaxAnisotropy());
    prepare(desk, deskRatio, a);
    prepare(mob, mobRatio, a);
  }, [desk, mob, deskRatio, mobRatio, gl]);

  const accent = useMemo(() => new Color(project.accent), [project.accent]);
  const glow = useMemo(() => getGlowTexture(), []);
  const scrollState = useRef({ d: 0, m: 0 });

  useFrame((state, dt) => {
    if (!root.current?.visible) return;
    const t = state.clock.elapsedTime;
    const p = cine.progress[id] ?? 0;
    const focus = cine.device[project.slug];

    // lid opens as the camera arrives
    const open = focus !== "auto" ? 1 : inOut(seg(p, 0.02, 0.22));
    if (lid.current) lid.current.rotation.x = lerp(Math.PI / 2 - 0.02, DEVICE.lidOpen, open);

    // the real site scrolls on the screen while we push into it
    const sTarget =
      focus === "desktop" ? (Math.sin(t * 0.18 - Math.PI / 2) + 1) / 2 : smooth(seg(p, 0.48, 0.95));
    const mTarget = focus === "mobile" ? (Math.sin(t * 0.22 - Math.PI / 2) + 1) / 2 : smooth(seg(p, 0.86, 1)) * 0.25;
    scrollState.current.d += (sTarget - scrollState.current.d) * Math.min(1, dt * 4);
    scrollState.current.m += (mTarget - scrollState.current.m) * Math.min(1, dt * 4);
    scrollTex(desk, scrollState.current.d);
    scrollTex(mob, scrollState.current.m);

    // phone rises in for the mobile chapter
    const ph = focus === "mobile" ? 1 : focus === "desktop" ? 0.0 : inOut(seg(p, 0.7, 0.9));
    if (phone.current) {
      phone.current.position.y = DEVICE.phone.y + lerp(-3.2, 0, ph) + Math.sin(t * 0.9) * 0.03 * ph;
      phone.current.rotation.y = lerp(-1.4, -0.38, ph);
      phone.current.rotation.z = lerp(0.3, 0.04, ph);
      phone.current.visible = ph > 0.001;
    }
    if (halo.current) halo.current.opacity = 0.12 + 0.08 * Math.sin(t * 1.3);
  });

  const base = WORLD.work(index);

  return (
    <group ref={root} position={base}>
      {/* LAPTOP */}
      <group>
        <RoundedBox args={[3.5, 0.12, 2.35]} radius={0.05} smoothness={4} position={[0, 0, 0.05]}>
          <DarkMetal rough={0.62} />
        </RoundedBox>
        {/* keyboard deck + trackpad */}
        <mesh position={[0, 0.062, -0.3]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[3.0, 1.05]} />
          <meshStandardMaterial color="#090909" metalness={0.3} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.062, 0.72]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1.15, 0.62]} />
          <meshStandardMaterial color="#202020" metalness={0.9} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.0, 1.225]}>
          <boxGeometry args={[3.3, 0.02, 0.01]} />
          <Gold />
        </mesh>
        <group ref={lid} position={DEVICE.hinge}>
          <RoundedBox args={[3.5, DEVICE.lidH, 0.07]} radius={0.04} smoothness={4} position={[0, DEVICE.lidH / 2, 0]}>
            <Graphite rough={0.3} />
          </RoundedBox>
          <mesh position={[0, DEVICE.lidH / 2 + 0.02, 0.0365]}>
            <planeGeometry args={[DEVICE.screenW + 0.08, DEVICE.screenH + 0.08]} />
            <meshBasicMaterial color="#000" />
          </mesh>
          <mesh position={[0, DEVICE.lidH / 2 + 0.02, 0.038]}>
            <planeGeometry args={[DEVICE.screenW, DEVICE.screenH]} />
            <meshBasicMaterial map={desk} toneMapped={false} color={[0.93, 0.93, 0.93]} />
          </mesh>
          {/* back of lid: brand line */}
          <mesh position={[0, DEVICE.lidH / 2, -0.037]} rotation-y={Math.PI}>
            <ringGeometry args={[0.2, 0.225, 48]} />
            <meshBasicMaterial color={GOLD} />
          </mesh>
        </group>
      </group>

      {/* PHONE */}
      <group ref={phone} position={DEVICE.phone}>
        <group position={[0, DEVICE.phoneH / 2, 0]}>
          <RoundedBox args={[DEVICE.phoneW + 0.08, DEVICE.phoneH + 0.1, 0.08]} radius={0.06} smoothness={5}>
            <Graphite rough={0.25} />
          </RoundedBox>
          <mesh position={[0, 0, 0.041]}>
            <planeGeometry args={[DEVICE.phoneW, DEVICE.phoneH]} />
            <meshBasicMaterial map={mob} toneMapped={false} color={[0.93, 0.93, 0.93]} />
          </mesh>
          <mesh position={[DEVICE.phoneW / 2 + 0.045, 0.35, 0]}>
            <boxGeometry args={[0.012, 0.22, 0.03]} />
            <Gold />
          </mesh>
        </group>
      </group>

      {/* pedestal + client accent halo */}
      <mesh position={[0.6, -0.08, 0.3]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[4.6, 96]} />
        <DarkMetal rough={0.3} />
      </mesh>
      <mesh position={[0.6, -0.07, 0.3]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[4.6, 4.64, 160]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 1.3, -3]}>
        <planeGeometry args={[11, 7]} />
        <meshBasicMaterial ref={halo} map={glow} color={accent} transparent opacity={0.15} depthWrite={false} />
      </mesh>
    </group>
  );
}
