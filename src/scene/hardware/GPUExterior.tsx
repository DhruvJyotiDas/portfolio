import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Batch, bevelPlate, Fasteners, Label, Part, type V3 } from './primitives'
import type { HardwareMaterials } from './materials'
import type { Quality } from '../config'
import GPUFans from './GPUFans'
import type { ThermalStore } from '../thermal/simulation'

export function Shroud({ materials, quality, reduced, startup, interactive, onInspect, thermal }: { materials: HardwareMaterials; quality: Quality; reduced: boolean; startup: React.RefObject<number>; interactive: boolean; onInspect: (key: string | null) => void; thermal: ThermalStore }) {
  const geometry = useMemo(() => {
    const holes = [-2.85, 0, 2.85].map(x => { const path = new THREE.Path(); path.absarc(x, 0, 1.24, 0, Math.PI * 2, true); return path })
    return bevelPlate(8.85, 3.27, .13, .22, holes)
  }, [])
  const screws = useMemo<V3[]>(() => [-4.21, -1.43, 1.43, 4.21].flatMap(x => [-1.43, 1.43].map(y => [x, y, .86] as V3)), [])
  const sideRibs = useMemo(() => ({ geometry: new THREE.BoxGeometry(.07, .1, .7), placements: Array.from({ length: 24 }, (_, i) => [-1, 1].map(side => ({ position: [-4.08 + i * .354, side * 1.57, .15] as V3 }))).flat() }), [])
  useEffect(() => () => { geometry.dispose(); sideRibs.geometry.dispose() }, [geometry, sideRibs])
  return <>
    <mesh geometry={geometry} position={[0, 0, .65]} material={materials.shell} />
    <GPUFans materials={materials} quality={quality} reduced={reduced} startup={startup} interactive={interactive} onInspect={onInspect} thermal={thermal} />
    <Batch {...sideRibs} material={materials.recess} />
    {[-1, 1].map(side => <group key={side}>
      <Part position={[0, side * 1.62, .59]} size={[8.4, .06, .32]} material={materials.frame} />
      <Part position={[0, side * 1.57, -.22]} size={[8.45, .095, .09]} material={materials.shell} />
      <Part position={[side * 4.28, 0, .27]} size={[.13, 2.78, .78]} material={materials.shell} bevel />
      <Part position={[side * 4.28, 0, .82]} size={[.055, 2.42, .025]} material={materials.frame} />
    </group>)}
    {[-1.425, 1.425].map((x, i) => <group key={x} position={[x, 0, .82]}>
      <Part size={[.14, 2.74, .09]} material={materials.frame} rotation={[0, 0, i === 0 ? -.15 : .15]} bevel />
      <Part position={[.012, 0, .12]} size={[.025, 2.4, .007]} material={materials.recess} rotation={[0, 0, i === 0 ? -.15 : .15]} />
    </group>)}
    <Part position={[-2.45, 1.41, .82]} size={[2.15, .155, .016]} material={materials.recess} />
    <Label text="NVIDIA  /  GEFORCE RTX" position={[-2.45, 1.41, .835]} width={1.95} height={.115} />
    <Part position={[-3.65, 1.4, .83]} size={[.12, .14, .02]} material={materials.accent} />
    <Label text="DJD / COMPUTE ENGINE" position={[2.8, -1.4, .84]} width={1.85} height={.105} color="#9ba49e" />
    <Label text="RESEARCH EDITION  /  S/N DJD-27-001" position={[-2.5, -1.42, .84]} width={2.28} height={.064} color="#848a89" />
    <Label text="GEFORCE RTX" position={[.15, 1.675, .12]} rotation={[-Math.PI / 2, 0, 0]} width={2.4} height={.3} color="#bec4c1" />
    <Part position={[-2.6, 1.68, .28]} size={[1.9, .022, .045]} material={materials.accent} />
    <Part position={[2.88, -1.63, .65]} size={[1.1, .018, .03]} material={materials.accent} />
    <Fasteners positions={screws} material={materials.frame} dark={materials.recess} />
  </>
}

export function Heatsink({ materials, quality, thermal }: { materials: HardwareMaterials; quality: Quality; thermal: ThermalStore }) {
  const resources = useMemo(() => {
    const count = quality === 'low' ? 54 : 106
    const fin = new THREE.BoxGeometry(.022, 2.88, .68)
    const placements = Array.from({ length: count }, (_, i) => ({ position: [-4.02 + i * 8.04 / (count - 1), 0, .04] as V3 }))
    const pipes = [-1.08, -.73, .73, 1.08].map(y => {
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-3.95, y * .8, -.18), new THREE.Vector3(-3.65, y, -.12), new THREE.Vector3(0, y, -.12), new THREE.Vector3(3.65, y, -.12), new THREE.Vector3(3.95, y * .8, -.18)])
      return new THREE.TubeGeometry(curve, 30, .068, 8, false)
    })
    return { fin, placements, pipes }
  }, [quality])
  useEffect(() => () => { resources.fin.dispose(); resources.pipes.forEach(p => p.dispose()) }, [resources])
  const wave = useMemo(() => new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uLoad: { value: 0 }, uHover: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'uniform float uTime;uniform float uLoad;uniform float uHover;varying vec2 vUv;void main(){float pulse=pow(max(0.,sin(vUv.x*24.-uTime*(1.+uLoad*5.))),12.);gl_FragColor=vec4(1.,.36+.35*uLoad,.08,(.03+pulse*(.34+.46*uHover))*uLoad);}', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), [])
  useEffect(() => () => wave.dispose(), [wave])
  useFrame(() => { wave.uniforms.uTime.value = thermal.current.time; wave.uniforms.uLoad.value = thermal.current.heatLoad / 100; wave.uniforms.uHover.value = thermal.current.hoverPulse })
  return <>
    <Batch geometry={resources.fin} placements={resources.placements} material={materials.aluminum} />
    {resources.pipes.map((geometry, i) => <group key={i}><mesh geometry={geometry} material={materials.copper} />{quality !== 'low' && <mesh geometry={geometry} material={wave} />}</group>)}
    <Part position={[0, 0, -.32]} size={[1.7, 1.6, .1]} material={materials.copper} bevel />
    <Part position={[0, 0, -.21]} size={[1.85, 1.75, .065]} material={materials.aluminum} bevel />
  </>
}

export function IOBracket({ materials, onInspect }: { materials: HardwareMaterials; onInspect: (key: string | null) => void }) {
  const geometry = useMemo(() => {
    const holes: THREE.Path[] = []
    for (let i = 0; i < 7; i++) {
      const y = -.99 + i * .32
      const path = new THREE.Path(); path.moveTo(-.43, y); path.lineTo(.05, y); path.lineTo(.05, y + .11); path.lineTo(-.43, y + .11); path.closePath(); holes.push(path)
    }
    for (let i = 0; i < 4; i++) {
      const y = -.99 + i * .63
      const path = new THREE.Path(); path.moveTo(.17, y); path.lineTo(.52, y); path.lineTo(.52, y + .39); path.lineTo(.17, y + .39); path.closePath(); holes.push(path)
    }
    return bevelPlate(1.36, 3.47, .055, .06, holes)
  }, [])
  const fasteners = useMemo<V3[]>(() => [[-.48, -1.5, .068], [-.48, 1.5, .068]], [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <group position={[4.49, 0, .05]} rotation={[0, Math.PI / 2, 0]} onPointerOver={event => { event.stopPropagation(); onInspect('io') }} onPointerOut={() => onInspect(null)}>
    <mesh geometry={geometry} material={materials.aluminum} />
    <Fasteners positions={fasteners} material={materials.frame} dark={materials.recess} />
    <Part position={[0, 1.83, -.05]} size={[1.3, .2, .075]} material={materials.frame} />
    <Part position={[0, -1.77, -.04]} size={[.28, .25, .07]} material={materials.frame} />
    <Label text="I/O" position={[-.22, 1.4, .065]} width={.32} height={.12} />
    {[0, 1, 2, 3].map(i => <group key={i}><Part position={[.35, -.8 + i * .63, -.065]} size={[.28, .31, .07]} material={materials.recess} /><Label text={i === 0 ? 'HDMI' : `DP ${i}`} position={[-.15, -.8 + i * .63, .067]} width={.33} height={.095} color="#d1dbcf" /></group>)}
  </group>
}

export function Backplate({ materials, thermal }: { materials: HardwareMaterials; thermal: ThermalStore }) {
  const heatLayer = useRef<THREE.Mesh>(null)
  const resources = useMemo(() => {
    const holes = Array.from({ length: 9 }, (_, i) => {
      const path = new THREE.Path(); const x = 2.13 + i * .2
      path.moveTo(x, -.65); path.lineTo(x + .08, -.65); path.lineTo(x + .08, .65); path.lineTo(x, .65); path.closePath(); return path
    })
    return { plate: bevelPlate(8.42, 3.1, .09, .19, holes), ribs: new THREE.BoxGeometry(2.1, .026, .02), placements: [-1, 1].flatMap(side => [0, 1, 2, 3].map(i => ({ position: [-2.66, side * (.65 + i * .14), -.86] as V3, rotation: [0, 0, side * -.13] as V3 }))) }
  }, [])
  const screws = useMemo<V3[]>(() => [-3.97, -1, 1, 3.97].flatMap(x => [-1.27, 1.27].map(y => [x, y, -.86] as V3)), [])
  useEffect(() => () => { resources.plate.dispose(); resources.ribs.dispose() }, [resources])
  const heatmap = useMemo(() => new THREE.ShaderMaterial({ uniforms: { uHeat: { value: 0 } }, vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'uniform float uHeat;varying vec2 vUv;void main(){float r=length((vUv-.5)*vec2(1.2,1.));float glow=pow(max(0.,1.-r*1.7),2.)*uHeat;gl_FragColor=vec4(1.,.22+glow*.5,.04,glow*.45);}', transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }), [])
  useEffect(() => () => heatmap.dispose(), [heatmap])
  useFrame(() => { heatmap.uniforms.uHeat.value = THREE.MathUtils.clamp((thermal.current.gpuTemp - 70) / 20, 0, 1); if (heatLayer.current) heatLayer.current.visible = heatmap.uniforms.uHeat.value > .01 })
  return <>
    <mesh position={[0, 0, -.84]} geometry={resources.plate} material={materials.shell} />
    <mesh ref={heatLayer} visible={false} position={[0, 0, -.93]} material={heatmap}><planeGeometry args={[3.4, 2.6]} /></mesh>
    <Batch geometry={resources.ribs} placements={resources.placements} material={materials.frame} />
    {[-1, 1].map(side => <Part key={side} position={[0, 0, -.89]} size={[2.05, .1, .04]} material={materials.frame} rotation={[0, 0, side * Math.PI / 4]} bevel />)}
    <Label text="NVIDIA  /  GEFORCE RTX" position={[-2.7, .23, -.89]} width={2.3} height={.2} back />
    <Label text="DJD — RESEARCH COMPUTE" position={[-2.7, -.17, -.89]} width={2.3} height={.1} back color="#83918a" />
    <Label text="PORTFOLIO.EXE  /  VALIDATED" position={[0, 1.12, -.89]} width={2.3} height={.08} back color="#889989" />
    <Label text="MODEL DJD-2027    S/N 27-001    REV 02" position={[0, -1.19, -.89]} width={2.4} height={.07} back color="#737d79" />
    {['ORACLE / JAVA SE 11', 'OCI / DATA SCIENCE', 'NPTEL / CS', 'IITM / FOUNDATIONAL'].map((text, i) => <Label key={text} text={text} position={[.45, .58 - i * .35, -.9]} width={1.64} height={.085} back color="#9faa9d" />)}
    <Fasteners positions={screws} material={materials.frame} dark={materials.recess} back />
  </>
}
