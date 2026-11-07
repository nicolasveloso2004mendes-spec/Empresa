"use client";
import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from "three";

/**
 * Infinite gold dust: positions wrap around the camera in the vertex shader,
 * so the whole film has atmospheric depth with one draw call and no CPU work.
 */
const SIZE = [44, 26, 60];
export function Dust({ count }: { count: number }) {
  const geo = useMemo(() => {
    const g = new BufferGeometry();
    const p = new Float32Array(count * 3);
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      p[i * 3] = Math.random() * SIZE[0];
      p[i * 3 + 1] = Math.random() * SIZE[1];
      p[i * 3 + 2] = Math.random() * SIZE[2];
      s[i] = Math.random();
    }
    g.setAttribute("position", new BufferAttribute(p, 3));
    g.setAttribute("seed", new BufferAttribute(s, 1));
    return g;
  }, [count]);

  const mat = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uSize: { value: [SIZE[0], SIZE[1], SIZE[2]] }, uPx: { value: 1 } },
        vertexShader: /* glsl */ `
          uniform float uTime; uniform vec3 uSize; uniform float uPx;
          attribute float seed; varying float vA;
          void main(){
            vec3 halfSize = uSize * 0.5;
            vec3 p = position + vec3(sin(uTime*0.1+seed*30.)*0.6, uTime*0.08*(0.3+seed), 0.);
            p = mod(p - cameraPosition + halfSize, uSize) - halfSize + cameraPosition;
            vec4 mv = modelViewMatrix * vec4(p,1.);
            gl_Position = projectionMatrix * mv;
            float d = -mv.z;
            gl_PointSize = uPx * (1.2 + seed*2.6) * (16. / max(d, 1.));
            vA = smoothstep(30., 6., d) * smoothstep(0.6, 2.5, d) * (0.25 + seed*0.75);
          }`,
        fragmentShader: /* glsl */ `
          varying float vA;
          void main(){
            float r = length(gl_PointCoord - .5);
            float a = smoothstep(.5, 0., r) * vA;
            gl_FragColor = vec4(vec3(0.95, 0.78, 0.38) * 1.2, a * .55);
          }`,
      }),
    [],
  );

  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    mat.uniforms.uPx.value = s.viewport.dpr;
  });

  return <points geometry={geo} material={mat} frustumCulled={false} />;
}
