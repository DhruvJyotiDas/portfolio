import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import type { Quality } from './config'

export default function GPUEnvironment({ quality, reduced }: { quality: Quality; reduced: boolean }) {
  const particles = useRef<THREE.Points>(null!), scan = useRef<THREE.Mesh>(null!)
  const resources = useMemo(() => {
    const lines: number[] = []
    for (let i = -8; i <= 8; i++) { lines.push(i, -2.7, -6, i, -2.7, 5); lines.push(-8, -2.7, i * .65, 8, -2.7, i * .65) }
    const grid = new THREE.BufferGeometry(); grid.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3))
    const corners: number[] = []
    for (const x of [-5, 5]) for (const y of [-2.25, 2.25]) {
      corners.push(x, y, -.7, x - Math.sign(x) * .36, y, -.7, x, y, -.7, x, y - Math.sign(y) * .3, -.7)
    }
    for (let i = -9; i <= 9; i++) corners.push(i * .5, -2.25, -.7, i * .5, -2.31 - (i % 2 ? 0 : .05), -.7)
    const frame = new THREE.BufferGeometry(); frame.setAttribute('position', new THREE.Float32BufferAttribute(corners, 3))
    const dots = new Float32Array(Array.from({ length: (quality === 'low' ? 24 : 65) * 3 }, (_, i) => { const n = Math.sin(i * 127.1 + 31.7) * 43758.5453; return ((n - Math.floor(n)) - .5) * (i % 3 === 2 ? 7 : 18) }))
    return { grid, frame, dots }
  }, [quality])
  useEffect(() => () => { resources.grid.dispose(); resources.frame.dispose() }, [resources])
  useFrame((_, dt) => {
    if (!reduced) { particles.current.rotation.z += dt * .003; scan.current.rotation.z += dt * .025 }
  })
  return <>
    <ambientLight intensity={.48} color="#c4cdc6" />
    <directionalLight position={[-3, 5, 7]} intensity={2.8} color="#d5e8c6" />
    <directionalLight position={[5, -1, 5]} intensity={1.1} color="#b6c4d8" />
    <directionalLight position={[1, 6, -4]} intensity={2.3} color="#ecf0ed" />
    <Environment resolution={quality === 'low' ? 128 : 256}>
      <Lightformer intensity={3.8} color="#f1f3f1" position={[-3, 4, 6]} scale={[9, 4, 1]} rotation={[Math.PI / 6, 0, 0]} />
      <Lightformer intensity={2.3} color="#d2dfe7" position={[5, 1, 3]} scale={[2, 7, 1]} rotation={[0, -Math.PI / 3, 0]} />
      <Lightformer intensity={1.8} color="#eef1ee" position={[0, -3, 7]} scale={[8, 2, 1]} rotation={[-Math.PI / 5, 0, 0]} />
      <Lightformer intensity={1.4} color="#c8d3ce" position={[-3, 3, -5]} scale={[8, 3, 1]} rotation={[0, Math.PI, 0]} />
      <Lightformer intensity={.25} color="#95b870" position={[-5, -1, 1]} scale={[4, 4, 1]} rotation={[0, Math.PI / 2, 0]} />
    </Environment>
    <lineSegments geometry={resources.grid}><lineBasicMaterial color="#829c8e" transparent opacity={.018} depthWrite={false} /></lineSegments>
    <lineSegments geometry={resources.frame}><lineBasicMaterial color="#829c8e" transparent opacity={.09} depthWrite={false} /></lineSegments>
    <mesh ref={scan} position={[0, 0, -2.2]}><ringGeometry args={[4.98, 4.989, 100, 1, 0, Math.PI * 1.2]} /><meshBasicMaterial color="#809782" transparent opacity={.025} depthWrite={false} side={THREE.DoubleSide} /></mesh>
    <points ref={particles}><bufferGeometry><bufferAttribute attach="attributes-position" args={[resources.dots, 3]} /></bufferGeometry><pointsMaterial color="#afbcb3" transparent opacity={.23} size={.012} depthWrite={false} /></points>
    {quality !== 'low' && <ContactShadows position={[0, -2.62, 0]} opacity={.27} scale={13} blur={3.5} far={5} resolution={128} frames={1} color="#000000" />}
  </>
}
