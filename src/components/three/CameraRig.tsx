"use client";
import { useEffect, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Spherical, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CameraView, Product } from "@/lib/schema";

export type CameraGoal = {
  view: CameraView;
  /** Quando definido, a câmera fica "presa" ao redor deste ponto (foco em hotspot). */
  focus?: boolean;
  nonce: number;
};

type Props = {
  product: Product;
  goal: CameraGoal;
  autoRotate: boolean;
  interactive: boolean;
  zoom: boolean;
  instant: boolean;
  onUserInteract?: () => void;
  controlsRef?: MutableRefObject<OrbitControlsImpl | null>;
};

const POLAR_MIN = 0.18 * Math.PI;
const POLAR_MAX = 0.82 * Math.PI;
const tmp = new Vector3();
const UP = new Vector3(0, 1, 0);
const AUTO_SPEED = 0.32; // rad/s
const sph = new Spherical();

/**
 * Câmera orbital com limites de segurança e transições suaves.
 * - Sem pan: o alvo nunca sai do aparelho, então o modelo não "some" da tela.
 * - minDistance maior que o raio do aparelho: a câmera não atravessa o modelo.
 * - Ângulo polar limitado: não vira de cabeça para baixo.
 * - Em foco de hotspot, a órbita fica restrita a um cone ao redor do detalhe.
 */
export function CameraRig({ product, goal, autoRotate, interactive, zoom, instant, onUserInteract, controlsRef }: Props) {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  // Em telas verticais (celular) o aparelho precisa de mais distância para caber inteiro.
  const fit = Math.min(1.6, Math.max(1, 0.78 / aspect));
  const controls = useRef<OrbitControlsImpl | null>(null);
  const anim = useRef<{ pos: Vector3; target: Vector3; focus: boolean } | null>(null);
  const dragging = useRef(false);
  const minDistance = product.camera.minDistance * fit;
  const maxDistance = product.camera.maxDistance * fit;

  const applyLimits = (focus: boolean) => {
    const c = controls.current;
    if (!c) return;
    if (focus) {
      const d = camera.position.distanceTo(c.target);
      sph.setFromVector3(tmp.copy(camera.position).sub(c.target));
      c.minDistance = Math.max(0.35, d * 0.6);
      c.maxDistance = Math.max(d * 1.6, d + 0.5);
      c.minAzimuthAngle = sph.theta - 0.65;
      c.maxAzimuthAngle = sph.theta + 0.65;
      c.minPolarAngle = Math.max(0.05, sph.phi - 0.5);
      c.maxPolarAngle = Math.min(Math.PI - 0.05, sph.phi + 0.5);
    } else {
      c.minDistance = minDistance;
      c.maxDistance = maxDistance;
      c.minAzimuthAngle = -Infinity;
      c.maxAzimuthAngle = Infinity;
      c.minPolarAngle = POLAR_MIN;
      c.maxPolarAngle = POLAR_MAX;
    }
  };

  // Nova meta de câmera.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const target = new Vector3(...goal.view.target);
    const pos = new Vector3(...goal.view.position).sub(target).multiplyScalar(fit).add(target);
    // Libera os limites durante o trajeto para não haver "saltos" de clamp.
    c.minDistance = 0.01;
    c.maxDistance = Infinity;
    c.minAzimuthAngle = -Infinity;
    c.maxAzimuthAngle = Infinity;
    c.minPolarAngle = 0;
    c.maxPolarAngle = Math.PI;
    if (instant) {
      camera.position.copy(pos);
      c.target.copy(target);
      c.update();
      applyLimits(!!goal.focus);
      anim.current = null;
    } else {
      anim.current = { pos, target, focus: !!goal.focus };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal.nonce, fit]);

  useEffect(() => {
    if (controlsRef) controlsRef.current = controls.current;
  });

  useFrame((_, dt) => {
    const a = anim.current;
    const c = controls.current;
    if (!c) return;
    // Rotação automática baseada em tempo (mesma velocidade em qualquer FPS); pausa durante o arrasto.
    if (!a && autoRotate && !goal.focus && !dragging.current) {
      tmp.copy(camera.position).sub(c.target).applyAxisAngle(UP, Math.min(dt, 0.1) * AUTO_SPEED);
      camera.position.copy(c.target).add(tmp);
      c.update();
    }
    if (!a) return;
    const k = 1 - Math.exp(-dt * 4.2);
    camera.position.lerp(a.pos, k);
    c.target.lerp(a.target, k);
    c.update();
    if (camera.position.distanceTo(a.pos) < 0.004 && c.target.distanceTo(a.target) < 0.004) {
      camera.position.copy(a.pos);
      c.target.copy(a.target);
      c.update();
      anim.current = null;
      applyLimits(a.focus);
    }
  });

  return (
    <OrbitControls
      ref={(r) => {
        controls.current = r as unknown as OrbitControlsImpl | null;
      }}
      makeDefault
      enabled={interactive}
      enablePan={false}
      enableZoom={zoom}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.75}
      zoomSpeed={0.7}
      minDistance={minDistance}
      maxDistance={maxDistance}
      minPolarAngle={POLAR_MIN}
      maxPolarAngle={POLAR_MAX}
      target={product.camera.initial.target}
      onEnd={() => {
        dragging.current = false;
      }}
      onStart={() => {
        dragging.current = true;
        // Interação do usuário interrompe a animação em curso, mantendo limites seguros.
        if (anim.current) {
          anim.current = null;
          applyLimits(false);
        }
        onUserInteract?.();
      }}
    />
  );
}
