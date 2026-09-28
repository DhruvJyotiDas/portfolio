import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

export type V3 = [number, number, number]
export type Placement = { position: V3; rotation?: V3; scale?: V3 }

export function bevelPlate(width: number, height: number, depth: number, corner = .1, holes: THREE.Path[] = []) {
  const shape = new THREE.Shape()
  const x = width / 2, y = height / 2
  shape.moveTo(-x + corner, -y); shape.lineTo(x - corner, -y); shape.lineTo(x, -y + corner)
  shape.lineTo(x, y - corner); shape.lineTo(x - corner, y); shape.lineTo(-x + corner, y)
  shape.lineTo(-x, y - corner); shape.lineTo(-x, -y + corner); shape.closePath()
  shape.holes = holes
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 2, bevelSize: .024, bevelThickness: .024, steps: 1, curveSegments: 48 })
}

export function Part({ position = [0, 0, 0], size, material, rotation = [0, 0, 0], bevel = false }: { position?: V3; size: V3; material: THREE.Material; rotation?: V3; bevel?: boolean }) {
  const geometry = useMemo(() => bevel ? bevelPlate(size[0], size[1], size[2], Math.min(.075, size[0] / 5, size[1] / 5)) : new THREE.BoxGeometry(...size), [size[0], size[1], size[2], bevel])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh position={position} rotation={rotation} geometry={geometry} material={material} />
}

export function Batch({ placements, geometry, material }: { placements: Placement[]; geometry: THREE.BufferGeometry; material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  useLayoutEffect(() => {
    const object = new THREE.Object3D()
    placements.forEach(({ position, rotation, scale }, index) => {
      object.position.set(...position); object.rotation.set(...(rotation || [0, 0, 0])); object.scale.set(...(scale || [1, 1, 1]))
      object.updateMatrix(); ref.current.setMatrixAt(index, object.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [placements, geometry])
  return <instancedMesh ref={ref} args={[geometry, material, placements.length]} />
}

export function Label({ text, position, width, height = .15, color = '#b4bcbd', back = false, rotation = [0, 0, 0], opacity = .85 }: { text: string; position: V3; width: number; height?: number; color?: string; back?: boolean; rotation?: V3; opacity?: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 96
    const ctx = canvas.getContext('2d')!
    ctx.font = '500 52px monospace'; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(text, 512, 48)
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4
    return map
  }, [text, color])
  useEffect(() => () => texture.dispose(), [texture])
  return <mesh position={position} rotation={back ? [0, Math.PI, 0] : rotation}><planeGeometry args={[width, height]} /><meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} polygonOffset polygonOffsetFactor={-1} /></mesh>
}

export function Fasteners({ positions, material, dark, back = false }: { positions: V3[]; material: THREE.Material; dark: THREE.Material; back?: boolean }) {
  const geometry = useMemo(() => ({ head: new THREE.CylinderGeometry(.064, .064, .036, 12), slot: new THREE.BoxGeometry(.067, .012, .006), washer: new THREE.TorusGeometry(.081, .012, 4, 16) }), [])
  useEffect(() => () => Object.values(geometry).forEach(g => g.dispose()), [geometry])
  const placements = useMemo(() => ({
    head: positions.map(position => ({ position, rotation: [Math.PI / 2, 0, 0] as V3 })),
    slots: positions.flatMap(([x, y, z], i) => [0, Math.PI / 2].map(r => ({ position: [x, y, z + (back ? -.022 : .022)] as V3, rotation: [0, 0, r + i * .7] as V3 }))),
    washers: positions.map(position => ({ position })),
  }), [positions, back])
  return <><Batch placements={placements.head} geometry={geometry.head} material={material} /><Batch placements={placements.slots} geometry={geometry.slot} material={dark} /><Batch placements={placements.washers} geometry={geometry.washer} material={dark} /></>
}
