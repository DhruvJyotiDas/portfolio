"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildField } from "@/lib/formations";

const VERT = `
  attribute vec3 aColor; attribute float aSeed;
  uniform float uTime; uniform float uSize; varying vec3 vColor;
  void main(){
    vColor = aColor;
    vec3 p = position;
    p.x += 0.18 * sin(uTime*0.5 + aSeed);
    p.y += 0.18 * cos(uTime*0.42 + aSeed*1.3);
    p.z += 0.18 * sin(uTime*0.33 + aSeed*0.7);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float tw = 0.7 + 0.3 * sin(uTime*1.4 + aSeed);
    gl_PointSize = uSize * tw * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;

const FRAG = `
  varying vec3 vColor;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float a = smoothstep(0.5, 0.0, length(c));
    gl_FragColor = vec4(vColor, a * 0.9);
  }`;

function Points({ formationRef }: { formationRef: MutableRefObject<number> }) {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const N = typeof window !== "undefined" && window.innerWidth < 700 ? 1100 : 2000;

  const { object, geometry, material, formations, cur } = useMemo(() => {
    const { formations, colors, seeds } = buildField(N);
    const cur = new Float32Array(formations[0]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(cur, 3));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uSize: { value: N < 1500 ? 2.0 : 2.6 } },
      vertexShader: VERT,
      fragmentShader: FRAG,
    });
    const object = new THREE.Points(geometry, material);
    return { object, geometry, material, formations, cur };
  }, [N]);

  // dispose GPU resources on unmount
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);

  const mouse = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.tx = e.clientX / window.innerWidth - 0.5;
      mouse.current.ty = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(({ camera }, delta) => {
    material.uniforms.uTime.value += reduced ? 0 : Math.min(delta, 0.05);
    const t = material.uniforms.uTime.value;
    const tgt = formations[formationRef.current] ?? formations[0];
    const lerp = reduced ? 1 : 0.045;
    for (let i = 0; i < cur.length; i++) cur[i] += (tgt[i] - cur[i]) * lerp;
    geometry.attributes.position.needsUpdate = true;

    const m = mouse.current;
    m.x += (m.tx - m.x) * 0.04;
    m.y += (m.ty - m.y) * 0.04;
    object.rotation.y = t * 0.12 + m.x * 0.5;
    object.rotation.x = m.y * 0.3;
    camera.position.x = m.x * 5;
    camera.position.y = -m.y * 4;
    camera.lookAt(0, 0, 0);
  });

  return <primitive object={object} />;
}

export default function Field({ formationRef }: { formationRef: MutableRefObject<number> }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 30], fov: 58, near: 0.1, far: 200 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
    >
      <Points formationRef={formationRef} />
    </Canvas>
  );
}
