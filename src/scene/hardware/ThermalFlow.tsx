import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Quality } from '../config'
import type { ThermalStore } from '../thermal/simulation'

// A sparse view of intake air crossing the fan plane toward the heatsink exhaust.
export default function ThermalFlow({ quality, reduced, store }: { quality: Quality; reduced: boolean; store: ThermalStore }) {
  const count = quality === 'low' ? 9 : 18
  const particles = useRef<THREE.InstancedMesh>(null!)
  const resources = useMemo(() => {
    const curves = Array.from({ length: count }, (_, i) => {
      const fan = i % 3, lane = Math.floor(i / 3)
      const x = [-2.85, 0, 2.85][fan] + (lane % 3 - 1) * .31
      const y = -.48 + lane * .19
      return new THREE.CatmullRomCurve3([new THREE.Vector3(x, y, 1.37), new THREE.Vector3(x + .05, y + .18, .62), new THREE.Vector3(x + .15, y + .58, .12), new THREE.Vector3(x + .27, 1.64, -.04)])
    })
    const positions: number[] = []
    for (const curve of curves) {
      const points = curve.getPoints(14)
      for (let i = 0; i < points.length - 1; i++) positions.push(...points[i].toArray(), ...points[i + 1].toArray())
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return { curves, geometry, bead: new THREE.SphereGeometry(.014, 6, 4) }
  }, [count])
  useEffect(() => () => { resources.geometry.dispose(); resources.bead.dispose() }, [resources])
  const object = useMemo(() => new THREE.Object3D(), [])
  useFrame(() => {
    resources.curves.forEach((curve, i) => {
      const t = reduced ? (i * .13) % 1 : (store.current.time * store.current.fanRPM / 8000 + i * .13) % 1
      object.position.copy(curve.getPoint(t)); object.updateMatrix()
      particles.current.setMatrixAt(i, object.matrix)
    })
    particles.current.instanceMatrix.needsUpdate = true
  })
  return <>
    <lineSegments geometry={resources.geometry}><lineBasicMaterial color="#a7ba9e" transparent opacity={.13} depthWrite={false} /></lineSegments>
    <instancedMesh ref={particles} args={[resources.bead, undefined, count]} frustumCulled={false}><meshBasicMaterial color="#b6d1ae" transparent opacity={.5} depthWrite={false} /></instancedMesh>
  </>
}
