import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

// Small, deterministic surface maps: low-amplitude machining marks, not visible grain.
export function useHardwareMaterials() {
  const resources = useMemo(() => {
    const rough = new Uint8Array(256 * 256 * 4)
    const normal = new Uint8Array(256 * 256 * 4)
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const n = Math.sin(y * 128.13 + x * .021) * 43758.5453
      const fraction = n - Math.floor(n)
      const i = (y * 256 + x) * 4
      rough.set([210 + fraction * 22, 210 + fraction * 22, 210 + fraction * 22, 255], i)
      normal.set([128, 126 + fraction * 4, 255, 255], i)
    }
    const roughnessMap = new THREE.DataTexture(rough, 256, 256)
    const normalMap = new THREE.DataTexture(normal, 256, 256)
    for (const map of [roughnessMap, normalMap]) {
      map.wrapS = map.wrapT = THREE.RepeatWrapping
      map.repeat.set(2, 5); map.anisotropy = 4; map.needsUpdate = true
    }
    const materials = {
      shell: new THREE.MeshStandardMaterial({ color: '#34393c', metalness: .87, roughness: .46, roughnessMap, normalMap, normalScale: new THREE.Vector2(.1, .1), envMapIntensity: 1.2 }),
      frame: new THREE.MeshStandardMaterial({ color: '#7c8385', metalness: .96, roughness: .3, roughnessMap, envMapIntensity: 1.15 }),
      polymer: new THREE.MeshStandardMaterial({ color: '#303437', metalness: .12, roughness: .4, envMapIntensity: .8, side: THREE.DoubleSide }),
      recess: new THREE.MeshStandardMaterial({ color: '#0e1214', metalness: .35, roughness: .63 }),
      aluminum: new THREE.MeshStandardMaterial({ color: '#9aa2a5', metalness: .94, roughness: .36, roughnessMap }),
      copper: new THREE.MeshStandardMaterial({ color: '#997957', metalness: .95, roughness: .31 }),
      pcb: new THREE.MeshStandardMaterial({ color: '#0b2019', metalness: .16, roughness: .68 }),
      solder: new THREE.MeshStandardMaterial({ color: '#9caaa6', metalness: .85, roughness: .36 }),
      ceramic: new THREE.MeshStandardMaterial({ color: '#8a8172', metalness: .08, roughness: .68 }),
      chip: new THREE.MeshStandardMaterial({ color: '#161d20', metalness: .18, roughness: .59 }),
      gold: new THREE.MeshStandardMaterial({ color: '#ba9650', metalness: .92, roughness: .25 }),
      accent: new THREE.MeshStandardMaterial({ color: '#83ac46', metalness: .5, roughness: .4, emissive: '#8dc847', emissiveIntensity: .15 }),
      ink: new THREE.MeshBasicMaterial({ color: '#acb2b1', transparent: true, opacity: .5, depthWrite: false }),
    }
    return { materials, maps: [roughnessMap, normalMap] }
  }, [])
  useEffect(() => () => {
    Object.values(resources.materials).forEach(material => material.dispose())
    resources.maps.forEach(map => map.dispose())
  }, [resources])
  return resources.materials
}
export type HardwareMaterials = ReturnType<typeof useHardwareMaterials>
