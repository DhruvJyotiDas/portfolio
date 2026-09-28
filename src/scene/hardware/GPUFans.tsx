import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Batch, Label, type V3 } from './primitives'
import type { HardwareMaterials } from './materials'
import type { Quality } from '../config'
import type { ThermalStore } from '../thermal/simulation'

// A swept, pitched airfoil. Unlike a flat extrusion, each radial section has camber.
function bladeGeometry(low: boolean) {
  const radial = low ? 9 : 20, chord = low ? 4 : 8
  const positions: number[] = [], uvs: number[] = [], indices: number[] = []
  for (let i = 0; i <= radial; i++) for (let j = 0; j <= chord; j++) {
    const t = i / radial, c = j / chord
    const radius = .25 + t * .875
    const sweep = -.15 + t * t * .34
    const width = .34 + Math.sin(t * Math.PI * .8) * .31
    const angle = sweep + (c - .5) * width
    const pitch = (c - .5) * (.15 + t * .14) + Math.sin(c * Math.PI) * .055 * Math.sin(t * Math.PI)
    positions.push(Math.cos(angle) * radius, Math.sin(angle) * radius, pitch)
    uvs.push(t, c)
    if (i < radial && j < chord) { const a = i * (chord + 1) + j; indices.push(a, a + chord + 1, a + 1, a + 1, a + chord + 1, a + chord + 2) }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals()
  return geometry
}

export default function GPUFans({ materials, quality, reduced, startup, interactive, onInspect, thermal }: { materials: HardwareMaterials; quality: Quality; reduced: boolean; startup: React.RefObject<number>; interactive: boolean; onInspect: (key: string | null) => void; thermal: ThermalStore }) {
  const rotors = useRef<(THREE.Group | null)[]>([])
  const blade = useMemo(() => bladeGeometry(quality === 'low'), [quality])
  const bladePositions = useMemo(() => Array.from({ length: 11 }, (_, i) => ({ position: [0, 0, 0] as V3, rotation: [0, 0, i / 11 * Math.PI * 2] as V3 })), [])
  const supports = useMemo(() => ({ geometry: new THREE.BoxGeometry(.06, 1.9, .05), placements: [-2.85, 0, 2.85].flatMap(x => [0, Math.PI / 3, -Math.PI / 3].map(r => ({ position: [x, 0, .42] as V3, rotation: [0, 0, r] as V3 }))) }), [])
  useEffect(() => () => { blade.dispose() }, [blade])
  useEffect(() => () => supports.geometry.dispose(), [supports])
  useFrame((_, dt) => {
    const speed = .02 + thermal.current.fanRPM * Math.PI / 30
    if (!reduced) rotors.current.forEach((rotor, i) => { if (rotor) rotor.rotation.z -= Math.min(dt, .04) * speed * startup.current * (1 - thermal.current.throttle * .3) * (i === 1 ? -1 : 1) })
  })
  return <>
    <Batch {...supports} material={materials.recess} />
    {[-2.85, 0, 2.85].map((x, i) => <group key={x} position={[x, 0, .69]} onPointerOver={interactive ? event => { event.stopPropagation(); onInspect('fan') } : undefined} onPointerOut={interactive ? () => onInspect(null) : undefined}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -.05]}><cylinderGeometry args={[1.188, 1.15, .3, quality === 'low' ? 48 : 80, 1, true]} /><primitive object={materials.recess} attach="material" /></mesh>
      <mesh position={[0, 0, .105]}><torusGeometry args={[1.21, .022, 5, 80]} /><primitive object={materials.frame} attach="material" /></mesh>
      <mesh position={[0, 0, -.15]}><torusGeometry args={[1.15, .016, 4, 64]} /><primitive object={materials.accent} attach="material" /></mesh>
      <group ref={node => { rotors.current[i] = node }} rotation={[0, 0, i * .29]}>
        <Batch placements={bladePositions} geometry={blade} material={materials.polymer} />
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, .045]}><cylinderGeometry args={[.31, .33, .13, 40]} /><primitive object={materials.polymer} attach="material" /></mesh>
        <mesh position={[0, 0, .115]}><circleGeometry args={[.275, 40]} /><primitive object={materials.shell} attach="material" /></mesh>
        <mesh position={[0, 0, .119]}><torusGeometry args={[.278, .005, 3, 40]} /><primitive object={materials.frame} attach="material" /></mesh>
        <Label text={i === 1 ? 'NVIDIA' : 'DJD'} position={[0, 0, .126]} width={i === 1 ? .39 : .25} height={.085} opacity={.8} />
      </group>
    </group>)}
  </>
}
