"use client";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import { Color, type Mesh, type PointLight, Vector3, FogExp2, type MeshBasicMaterial } from "three";
import { createShot, direct } from "@/lib/animation/director";
import { cine, SCENES } from "@/lib/animation/store";

/** shared, read by Effects for depth-of-field focus */
export const focusTarget = new Vector3();

/**
 * Applies the Director's shot every frame with critically-damped smoothing:
 * scroll gives intent, the rig gives inertia — dolly, orbit, tracking.
 */
export function DirectorRig() {
  const { camera, scene } = useThree();
  const shot = useMemo(createShot, []);
  const look = useRef(new Vector3(0, 0, -10));
  const light = useRef<PointLight>(null);
  const rim = useRef<PointLight>(null);
  const glow = useRef<Mesh>(null);
  const col = useMemo(() => new Color(), []);
  const env = useRef({ v: 0, fog: 0.035 });

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const cam = state.camera as typeof camera & { fov: number; aspect: number; updateProjectionMatrix: () => void };
    direct(shot, state.size.width / state.size.height, state.clock.elapsedTime);

    easing.damp3(cam.position, shot.pos, shot.smoothTime, dt);
    easing.damp3(look.current, shot.target, shot.smoothTime * 0.85, dt);
    cam.lookAt(look.current);
    focusTarget.copy(look.current);
    if (Math.abs(cam.fov - shot.fov) > 0.01) {
      cam.fov += (shot.fov - cam.fov) * Math.min(1, dt * 4);
      cam.updateProjectionMatrix();
    }

    if (light.current) {
      easing.damp3(light.current.position, shot.key, 0.5, dt);
      light.current.intensity += (shot.keyIntensity - light.current.intensity) * Math.min(1, dt * 3);
      col.copy(shot.keyColor);
      light.current.color.lerp(col, Math.min(1, dt * 3));
    }
    if (rim.current) {
      rim.current.position.set(cam.position.x - 6, cam.position.y + 2, cam.position.z - 14);
      rim.current.intensity = 12 * env.current.v;
    }

    // the visible "small light" — only in the intro and the finale
    const id = SCENES[cine.active];
    if (glow.current) {
      const lit = id === "intro" ? cine.introAuto * (1 - cine.progress.intro) : id === "final" ? cine.progress.final : 0;
      const s = 0.025 + lit * (id === "final" ? 0.035 : 0.07);
      glow.current.scale.setScalar(s);
      (glow.current.material as MeshBasicMaterial).opacity = Math.min(1, lit * 1.6);
    }

    env.current.v += (shot.exposure - env.current.v) * Math.min(1, dt * 2.5);
    env.current.fog += (shot.fog - env.current.fog) * Math.min(1, dt * 2);
    scene.environmentIntensity = env.current.v;
    if (scene.fog instanceof FogExp2) scene.fog.density = env.current.fog;
  });

  return (
    <>
      <pointLight ref={light} intensity={0} distance={40} decay={1.6} color="#D4AF37">
        <mesh ref={glow}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshBasicMaterial color={[3.2, 2.3, 0.75]} toneMapped={false} transparent opacity={0} />
        </mesh>
      </pointLight>
      <pointLight ref={rim} intensity={0} distance={50} decay={1.2} color="#F5F5F5" />
      <directionalLight position={[4, 8, 6]} intensity={0.25} color="#F5F5F5" />
    </>
  );
}
