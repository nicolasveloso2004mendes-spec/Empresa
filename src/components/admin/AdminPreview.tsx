"use client";
import { Suspense, useCallback, useEffect, useImperativeHandle, useRef, type Ref, type RefObject } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Box3, Matrix3, Quaternion, Vector3, type Group, type MeshStandardMaterial } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CameraView, Product, Vec3 } from "@/lib/schema";
import { PhoneModel } from "@/components/three/PhoneModel";
import { Studio } from "@/components/three/Studio";
import { Hotspots } from "@/components/three/Hotspots";
import { ViewerBoundary } from "@/components/three/ViewerBoundary";
import { ViewerLoader } from "@/components/three/Loader";

export type PreviewHandle = {
  captureCamera: () => CameraView | null;
  setCamera: (v: CameraView) => void;
  /** Escala/posição que deixam o modelo com 1,5 unidade de altura, centralizado. */
  autoFit: () => { scale: number; position: Vec3 } | null;
};

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const r4 = (v: number) => Math.round(v * 10000) / 10000;

function Bridge({ handleRef, group }: { handleRef: Ref<PreviewHandle>; group: RefObject<Group | null> }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  useImperativeHandle(handleRef, () => ({
    captureCamera: () =>
      controls ? { position: camera.position.toArray().map(r3) as Vec3, target: controls.target.toArray().map(r3) as Vec3 } : null,
    setCamera: (v) => {
      camera.position.set(...v.position);
      controls?.target.set(...v.target);
      controls?.update();
    },
    autoFit: () => {
      const g = group.current;
      if (!g) return null;
      const inner = g.children[0];
      if (!inner) return null;
      const box = new Box3().setFromObject(inner, true);
      // setFromObject usa a matriz de mundo; remove a escala atual do grupo.
      const s = g.scale.x || 1;
      const size = box.getSize(new Vector3()).divideScalar(s);
      const center = box.getCenter(new Vector3()).sub(g.position).divideScalar(s);
      const scale = 1.5 / Math.max(size.y, 1e-6);
      return { scale: r4(scale), position: center.multiplyScalar(-scale).toArray().map(r4) as Vec3 };
    },
  }), [camera, controls, group]);
  return null;
}

export function AdminPreview({
  product,
  colorId,
  pickMode,
  onPick,
  onMaterials,
  handleRef,
}: {
  product: Product;
  colorId: string;
  pickMode: boolean;
  onPick: (p: { position: Vec3; normal: Vec3 }) => void;
  onMaterials: (names: string[]) => void;
  handleRef: Ref<PreviewHandle>;
}) {
  const group = useRef<Group | null>(null);
  const variant = product.colors.find((c) => c.id === colorId) ?? product.colors[0];
  const lastNames = useRef("");
  const handleMaterials = useCallback(
    (m: Map<string, MeshStandardMaterial>) => {
      const names = [...m.keys()].sort();
      const key = names.join("|");
      if (key !== lastNames.current) {
        lastNames.current = key;
        onMaterials(names);
      }
    },
    [onMaterials],
  );

  const pick = (e: ThreeEvent<MouseEvent>) => {
    if (!pickMode || !group.current || !e.face) return;
    e.stopPropagation();
    const local = group.current.worldToLocal(e.point.clone());
    const nm = new Matrix3().getNormalMatrix(e.object.matrixWorld);
    const worldNormal = e.face.normal.clone().applyMatrix3(nm).normalize();
    const inv = group.current.getWorldQuaternion(new Quaternion()).invert();
    const localNormal = worldNormal.applyQuaternion(inv).normalize();
    // Afasta levemente da superfície para o marcador não "entrar" no modelo.
    local.addScaledVector(localNormal, 0.0004);
    onPick({ position: local.toArray().map(r4) as Vec3, normal: localNormal.toArray().map(r3) as Vec3 });
  };

  useEffect(() => {
    document.body.style.cursor = pickMode ? "crosshair" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [pickMode]);

  return (
    <div className="relative h-full min-h-[420px] overflow-hidden rounded-2xl border border-line bg-black">
      <ViewerBoundary
        resetKey={product.model.url + (variant.modelUrl ?? "")}
        fallback={(e) => <p className="p-6 text-sm text-red-300">Não foi possível carregar o modelo: {e.message}</p>}
      >
        <Canvas dpr={[1, 1.5]} camera={{ position: product.camera.initial.position, fov: product.camera.fov, near: 0.01, far: 100 }}>
          <Studio />
          <Suspense fallback={null}>
            <group onClick={pick}>
              <PhoneModel product={product} variant={variant} groupRef={group} onMaterials={handleMaterials}>
                <Hotspots hotspots={product.hotspots} activeId={null} onSelect={() => undefined} visible />
              </PhoneModel>
            </group>
          </Suspense>
          <OrbitControls makeDefault enablePan target={product.camera.initial.target} />
          <Bridge handleRef={handleRef} group={group} />
        </Canvas>
        <ViewerLoader label="Carregando modelo" />
      </ViewerBoundary>
      {pickMode && (
        <div className="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-champagne px-4 py-1.5 text-xs font-semibold text-black">
          Clique no modelo para posicionar o hotspot
        </div>
      )}
    </div>
  );
}
