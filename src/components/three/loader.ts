"use client";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type { WebGLRenderer } from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import type { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/** Decoders servidos localmente (copiados por scripts/copy-decoders.mjs). */
export const DRACO_PATH = "/decoders/draco/";
export const BASIS_PATH = "/decoders/basis/";

let ktx2: KTX2Loader | null = null;
let ktx2Renderer: WebGLRenderer | null = null;

function getKTX2(gl: WebGLRenderer) {
  if (!ktx2 || ktx2Renderer !== gl) {
    ktx2?.dispose();
    ktx2 = new KTX2Loader().setTranscoderPath(BASIS_PATH).detectSupport(gl);
    ktx2Renderer = gl;
  }
  return ktx2;
}

/**
 * Carrega GLB/GLTF com suporte a Draco, Meshopt e texturas KTX2 (Basis Universal).
 * Os arquivos são cacheados por URL — vários visualizadores compartilham o mesmo download.
 */
export function useProductGLTF(url: string) {
  const gl = useThree((s) => s.gl);
  return useGLTF(url, DRACO_PATH, true, (loader) => {
    (loader as unknown as GLTFLoader).setKTX2Loader(getKTX2(gl));
  });
}
