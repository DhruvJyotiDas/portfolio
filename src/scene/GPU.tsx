import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ProjectId } from '../content'
import type { JourneyState } from '../hooks/useJourney'
import type { Quality } from './config'
import { useHardwareMaterials } from './hardware/materials'
import { Backplate, Heatsink, IOBracket, Shroud } from './hardware/GPUExterior'
import GPUBoard from './hardware/GPUBoard'
import { hardwareState, type InspectionMode } from './hardware/state'
import ThermalFlow from './hardware/ThermalFlow'
import LiquidLoop, { type CoolantTheme } from './thermal/LiquidLoop'
import type { ThermalStore } from './thermal/simulation'

export interface HardwareMotion { shroud: number; heatsink: number; backplate: number; explode: number }
type FadingMaterial = { material: THREE.Material; opacity: number }

export default function GPU(props: { journey: RefObject<JourneyState>; reduced: boolean; quality: Quality; hovered: ProjectId | null; onHover: (id: ProjectId | null) => void; onSelect: (id: ProjectId) => void; activeRole: number; activeSkill: number; activeZone: number; startup: RefObject<number>; motion: RefObject<HardwareMotion>; onInspect: (key: string | null) => void; inspectionMode: InspectionMode; thermal: ThermalStore; coolantTheme: CoolantTheme }) {
  const exterior = useRef<THREE.Group>(null!), thermal = useRef<THREE.Group>(null!), back = useRef<THREE.Group>(null!)
  const irBlend = useRef(0)
  // Layers own their materials: exterior fades never change PCB components.
  const exteriorMaterials = useHardwareMaterials(), thermalMaterials = useHardwareMaterials(), boardMaterials = useHardwareMaterials(), backMaterials = useHardwareMaterials()
  const cached = useMemo(() => ({ exterior: [] as FadingMaterial[], thermal: [] as FadingMaterial[] }), [])
  const irColors = useMemo(() => ({ shell: new THREE.Color('#111c63'), frame: new THREE.Color('#305db4'), polymer: new THREE.Color('#153d80'), recess: new THREE.Color('#102053'), aluminum: new THREE.Color('#49e9ef'), copper: new THREE.Color('#ffcf42'), pcb: new THREE.Color('#142b79'), solder: new THREE.Color('#76e8f4'), ceramic: new THREE.Color('#eaffaa'), chip: new THREE.Color('#fff4a6'), gold: new THREE.Color('#ffda58'), accent: new THREE.Color('#fffbde') }), [])
  useLayoutEffect(() => {
    for (const [object, list] of [[exterior.current, cached.exterior], [thermal.current, cached.thermal]] as const) {
      const seen = new Set<THREE.Material>(); list.length = 0
      object.traverse(child => {
        if (!(child instanceof THREE.Mesh)) return
        for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
          if (!seen.has(material)) {
            seen.add(material)
            // Compile the fading variant up front to avoid a shader hitch on first scroll.
            material.transparent = true
            material.userData.baseOpacity ??= material.opacity
            list.push({ material, opacity: material.userData.baseOpacity })
          }
        }
      })
    }
  }, [props.quality, cached])
  useFrame((_, dt) => {
    const progress = props.reduced ? 0 : props.journey.current.progress
    const explode = Math.sin(THREE.MathUtils.smoothstep(progress, .16, .96) * Math.PI)
    exterior.current.position.z = THREE.MathUtils.damp(exterior.current.position.z, explode * .85, 9, dt)
    thermal.current.position.z = THREE.MathUtils.damp(thermal.current.position.z, explode * .32, 9, dt)
    back.current.position.z = THREE.MathUtils.damp(back.current.position.z, -explode * .18, 9, dt)
    const exteriorOpacity = (1 - THREE.MathUtils.smoothstep(progress, .52, 1.05)) * (props.inspectionMode === 'exterior' ? 1 : props.inspectionMode === 'xray' ? .2 : props.inspectionMode === 'signal' ? .025 : .08)
    const thermalOpacity = (1 - THREE.MathUtils.smoothstep(progress, .65, 1.08)) * (props.inspectionMode === 'exterior' ? 1 : props.inspectionMode === 'xray' ? .48 : props.inspectionMode === 'signal' ? .04 : .16)
    for (const [group, materials, opacity] of [[exterior.current, cached.exterior, exteriorOpacity], [thermal.current, cached.thermal, thermalOpacity]] as const) {
      group.visible = opacity > .015
      if (!group.visible) continue
      for (const item of materials) {
        item.material.opacity = item.opacity * opacity
        item.material.depthWrite = opacity > .97 && item.opacity === 1
      }
    }
    const state = hardwareState(progress)
    const heat = props.thermal.current
    exteriorMaterials.accent.emissiveIntensity = .005 + state.power * .26
    thermalMaterials.copper.emissive.set('#733b1d')
    thermalMaterials.copper.emissiveIntensity = props.inspectionMode === 'thermal' ? .58 : heat.heatLoad / 100 * .22
    irBlend.current = THREE.MathUtils.damp(irBlend.current, props.inspectionMode === 'thermal' ? 1 : 0, 8, dt)
    for (const materials of [exteriorMaterials, thermalMaterials, boardMaterials, backMaterials]) for (const key of Object.keys(irColors) as (keyof typeof irColors)[]) {
      const material = materials[key]
      if (!('color' in material) || !(material.color instanceof THREE.Color)) continue
      if (!material.userData.baseIRColor) material.userData.baseIRColor = material.color.clone()
      material.color.copy(material.userData.baseIRColor).lerp(irColors[key], irBlend.current)
      if (material instanceof THREE.MeshStandardMaterial) {
        if (!material.userData.baseIREmissive) material.userData.baseIREmissive = material.emissive.clone()
        material.emissive.copy(material.userData.baseIREmissive).lerp(irColors[key], irBlend.current * .62)
        material.emissiveIntensity = Math.max(material.emissiveIntensity, irBlend.current * (key === 'chip' ? .7 : .18))
      }
    }
    props.motion.current = { shroud: exterior.current.position.z, heatsink: thermal.current.position.z, backplate: back.current.position.z, explode }
  })
  return <>
    <group ref={exterior}><Shroud materials={exteriorMaterials} quality={props.quality} reduced={props.reduced} startup={props.startup} interactive={props.activeZone === 0} onInspect={props.onInspect} thermal={props.thermal} /></group>
    <group ref={thermal}><Heatsink materials={thermalMaterials} quality={props.quality} thermal={props.thermal} /></group>
    <group ref={back}><Backplate materials={backMaterials} thermal={props.thermal} /></group>
    <GPUBoard {...props} materials={boardMaterials} />
    <LiquidLoop store={props.thermal} quality={props.quality} reduced={props.reduced} theme={props.coolantTheme} ir={props.inspectionMode === 'thermal'} />
    <IOBracket materials={boardMaterials} onInspect={props.onInspect} />
    <ThermalFlow quality={props.quality} reduced={props.reduced} store={props.thermal} />
  </>
}
