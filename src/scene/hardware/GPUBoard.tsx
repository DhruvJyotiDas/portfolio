import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { content, projects, type ProjectId } from '../../content'
import type { JourneyState } from '../../hooks/useJourney'
import { Batch, Fasteners, Label, Part, type Placement, type V3 } from './primitives'
import type { HardwareMaterials } from './materials'
import { hardwareState, type InspectionMode } from './state'

export const memoryPositions: V3[] = [[-2.7, 1.02, -.43], [-.9, 1.12, -.43], [.92, 1.02, -.43], [2.7, 1.02, -.43], [1.8, -1.03, -.43], [-1.8, -1.03, -.43]]

function usePCBTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 512
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#11261e'; ctx.fillRect(0, 0, 1024, 512); ctx.lineWidth = .8
    for (let i = 0; i < 100; i++) {
      const side = i % 2 ? 1 : -1, row = Math.floor(i / 2), y = 25 + row * 9.2, x = 512 + side * 98
      ctx.strokeStyle = i % 3 === 0 ? '#354335' : '#233a2b'
      ctx.beginPath(); ctx.moveTo(x, 256 + (y - 256) * .52); ctx.lineTo(x + side * (28 + row % 7 * 4), 256 + (y - 256) * .52)
      ctx.lineTo(x + side * (69 + row % 7 * 4), y); ctx.lineTo(50 + (i * 193 % 920), y); ctx.stroke()
      ctx.fillStyle = '#6d7859'; ctx.beginPath(); ctx.arc(100 + (i * 157 % 820), y, 1.8, 0, Math.PI * 2); ctx.fill()
    }
    ctx.font = '9px monospace'; ctx.fillStyle = '#809386'
    for (let i = 0; i < 30; i++) ctx.fillText(`${i % 2 ? 'R' : 'C'}${110 + i}`, 32 + i % 15 * 66, i < 15 ? 31 : 488)
    ctx.font = '11px monospace'; ctx.fillText('GPU_CORE', 464, 380); ctx.fillText('SYS_BUS', 810, 390); ctx.fillText('PCIE_X16', 354, 500)
    ctx.fillText('PWR_STAGE', 37, 71); ctx.fillText('DJD / REV 02', 786, 32)
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; return map
  }, [])
  useEffect(() => () => texture.dispose(), [texture]); return texture
}

const traceVertex = /* glsl */`
  attribute float aPhase;
  attribute float aKind;
  varying float vPhase;
  varying float vKind;
  varying vec2 vUv;
  void main() {
    vPhase = aPhase;
    vKind = aKind;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const traceFragment = /* glsl */`
  uniform float uTime;
  uniform float uPower;
  uniform float uData;
  uniform float uSignal;
  uniform float uMode;
  uniform float uActive;
  varying float vPhase;
  varying float vKind;
  varying vec2 vUv;
  void main() {
    float stage = vKind < .5 ? uPower : vKind < 1.5 ? uData : uSignal;
    float speed = vKind < .5 ? .44 : 1.5;
    float travel = fract(vUv.x * 1.6 - uTime * speed + vPhase * .113);
    float packet = exp(-pow((travel - .52) * 15., 2.));
    float tail = exp(-max(0., travel - .52) * 13.) * step(.52, travel);
    vec3 color = vKind < .5 ? vec3(.55, .72, .36) : vKind < 1.5 ? vec3(.38, .62, .46) : vec3(.54, .71, .66);
    color *= abs(mod(vPhase, 5.) - uActive) < .1 ? 1.45 : 1.;
    float line = smoothstep(.5, .18, abs(vUv.y - .5));
    float intensity = (.045 + stage * (.12 + packet * .8 + tail * .14)) * mix(1., 1.9, uMode);
    gl_FragColor = vec4(color * intensity, line * (.06 + stage * (.15 + packet * .52)) * mix(1., 1.6, uMode));
  }
`

function Circuitry({ reduced, activeSkill, journey, inspectionMode }: { reduced: boolean; activeSkill: number; journey: React.RefObject<JourneyState>; inspectionMode: InspectionMode }) {
  const material = useRef<THREE.ShaderMaterial>(null!)
  const geometry = useMemo(() => {
    const makePath = (points: number[][], phase: number, kind: number) => {
      const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)))
      const path = new THREE.TubeGeometry(curve, 22, kind === 0 ? .009 : .005, 3, false)
      path.setAttribute('aPhase', new THREE.Float32BufferAttribute(new Float32Array(path.attributes.position.count).fill(phase), 1))
      path.setAttribute('aKind', new THREE.Float32BufferAttribute(new Float32Array(path.attributes.position.count).fill(kind), 1))
      return path
    }
    const paths = Array.from({ length: 24 }, (_, i) => {
      const side = i % 2 ? 1 : -1, row = Math.floor(i / 2), y = (row - 5.5) * .21
      return makePath([[side * .79, y * .5, -.477], [side * 1.12, y * .5, -.477], [side * 1.48, y, -.477], [side * (2.6 + row % 3 * .25), y, -.477]], i, 1)
    })
    for (let i = 0; i < 4; i++) paths.push(makePath([[2.99, 1.5, -.47], [2.35 - i * .18, 1.33, -.47], [1.5 - i * .4, .83 - i * .37, -.47], [-1.75 - i * .38, .72 - i * .42, -.47], [-3.5, .82 - i * .8, -.47]], 24 + i, 0))
    for (let i = 0; i < 3; i++) paths.push(makePath([[-3.4, .82 - i * .8, -.47], [-2.25, .67 - i * .48, -.47], [-1.4, .3 - i * .14, -.47], [-.73, .12 - i * .13, -.47]], 28 + i, 0))
    paths.push(makePath([[-.6, -1.63, -.47], [-.6, -1.12, -.47], [-.36, -.69, -.47]], 31, 2))
    const merged = mergeGeometries(paths)!; paths.forEach(path => path.dispose()); return merged
  }, [])
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uPower: { value: 0 }, uData: { value: 0 }, uSignal: { value: 0 }, uMode: { value: 0 }, uActive: { value: -1 } }), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  useFrame(({ clock }) => {
    const state = hardwareState(journey.current.progress)
    material.current.uniforms.uTime.value = reduced ? 0 : clock.elapsedTime
    material.current.uniforms.uPower.value = inspectionMode === 'signal' ? .45 : state.power
    material.current.uniforms.uData.value = inspectionMode === 'signal' ? 1 : state.memory
    material.current.uniforms.uSignal.value = inspectionMode === 'signal' ? 1 : state.output
    material.current.uniforms.uMode.value = inspectionMode === 'signal' ? 1 : 0
    material.current.uniforms.uActive.value = activeSkill
  })
  return <mesh geometry={geometry}><shaderMaterial ref={material} uniforms={uniforms} transparent depthWrite={false} vertexShader={traceVertex} fragmentShader={traceFragment} /></mesh>
}

function Core({ materials, onInspect, active, journey }: { materials: HardwareMaterials; onInspect: (key: string | null) => void; active: boolean; journey: React.RefObject<JourneyState> }) {
  const floorMaterial = useRef<THREE.MeshBasicMaterial>(null!)
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#253237'; ctx.fillRect(0, 0, 512, 512)
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      ctx.fillStyle = (x + y) % 3 ? '#364747' : '#2a3c3e'; ctx.fillRect(8 + x * 63, 8 + y * 63, 54, 54)
      ctx.strokeStyle = '#53615b'; ctx.lineWidth = .7
      for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(11 + x * 63 + i * 5.5, 12 + y * 63); ctx.lineTo(11 + x * 63 + i * 5.5, 57 + y * 63); ctx.stroke() }
      ctx.strokeStyle = '#4c5753'; ctx.strokeRect(8 + x * 63, 8 + y * 63, 54, 54)
    }
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; return map
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  const floorplan = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, 512, 512)
    ctx.lineWidth = 1; ctx.strokeStyle = '#aec899'
    for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
      const x = 30 + col * 115, y = 36 + row * 310
      ctx.globalAlpha = .45; ctx.strokeRect(x, y, 100, 120)
      ctx.globalAlpha = .42; for (let i = 0; i < 6; i++) ctx.fillRect(x + 7 + i * 15, y + 13, 8, 93)
      ctx.globalAlpha = .58; ctx.font = '12px monospace'; ctx.fillStyle = '#c2d6af'; ctx.fillText(`GPC ${row * 4 + col + 1}`, x + 12, y + 136)
    }
    ctx.globalAlpha = .43; ctx.strokeStyle = '#a9d18b'; ctx.strokeRect(35, 214, 442, 88)
    for (let i = 0; i < 22; i++) ctx.fillRect(43 + i * 19, 231, 11, 53)
    ctx.globalAlpha = .75; ctx.font = '13px monospace'; ctx.fillText('L2 CACHE / MEMORY FABRIC', 112, 326)
    ctx.globalAlpha = 1
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; return map
  }, [])
  useEffect(() => () => floorplan.dispose(), [floorplan])
  useFrame(() => { floorMaterial.current.opacity = hardwareState(journey.current.progress).core * .95 })
  const caps = useMemo(() => ({ geometry: new THREE.BoxGeometry(.065, .105, .025), placements: Array.from({ length: 12 }, (_, i) => [-1, 1].map(side => ({ position: [side * .88, -.58 + i * .105, -.365] as V3 }))).flat() }), [])
  useEffect(() => () => caps.geometry.dispose(), [caps])
  const contacts = useMemo(() => ({ geometry: new THREE.BoxGeometry(.035, .024, .01), placements: Array.from({ length: 18 }, (_, i) => [-1, 1].map(side => ({ position: [-.71 + i * .083, side * .69, -.352] as V3 }))).flat() }), [])
  useEffect(() => () => contacts.geometry.dispose(), [contacts])
  const screws = useMemo<V3[]>(() => [-.97, .97].flatMap(x => [-.85, .85].map(y => [x, y, -.34] as V3)), [])
  return <group onPointerOver={active ? event => { event.stopPropagation(); onInspect('core') } : undefined} onPointerOut={active ? () => onInspect(null) : undefined}>
    <Part position={[0, 0, -.445]} size={[1.91, 1.73, .065]} material={materials.recess} bevel />
    <Part position={[0, 0, -.397]} size={[1.55, 1.37, .03]} material={materials.solder} bevel />
    <Part position={[0, 0, -.36]} size={[1.48, 1.3, .025]} material={materials.chip} />
    <mesh position={[0, 0, -.335]}><planeGeometry args={[1.39, 1.2]} /><meshPhysicalMaterial map={texture} color="#96a5a8" metalness={.66} roughness={.24} clearcoat={.65} clearcoatRoughness={.15} iridescence={.54} iridescenceIOR={1.6} iridescenceThicknessRange={[240, 510]} envMapIntensity={1.25} /></mesh>
    <mesh position={[0, 0, -.331]}><planeGeometry args={[1.37, 1.18]} /><meshBasicMaterial ref={floorMaterial} map={floorplan} transparent opacity={0} depthWrite={false} /></mesh>
    <Label text="BLACKWELL INSPIRED  /  DJD" position={[0, .05, -.327]} width={.82} height={.07} opacity={.65} />
    <Label text="VISUALIZATION  /  2027" position={[0, -.12, -.326]} width={.75} height={.055} color="#849b92" />
    <Batch {...caps} material={materials.ceramic} />
    <Batch {...contacts} material={materials.gold} />
    <Fasteners positions={screws} material={materials.solder} dark={materials.recess} />
  </group>
}

function Components({ materials, activeRole, journey }: { materials: HardwareMaterials; activeRole: number; journey: React.RefObject<JourneyState> }) {
  const indicators = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const resources = useMemo(() => {
    const passives: Placement[] = [], terminals: Placement[] = [], caps: Placement[] = [], inductors: Placement[] = []
    for (let row = 0; row < 6; row++) for (let col = 0; col < 26; col++) {
      const x = -3.94 + col * .307, y = -1.35 + row * .54
      if ((Math.abs(x) < 2.6 && Math.abs(y) > .7) || (Math.abs(x) < 1.1 && Math.abs(y) < .95) || x < -2.8) continue
      passives.push({ position: [x, y, -.452], rotation: [0, 0, col % 3 ? 0 : Math.PI / 2] })
      for (const side of [-1, 1]) terminals.push({ position: [x + (col % 3 ? side * .065 : 0), y + (col % 3 ? 0 : side * .065), -.45] })
    }
    for (let row = 0; row < 3; row++) for (let col = 0; col < 2; col++) {
      inductors.push({ position: [-3.7 + col * .48, .82 - row * .8, -.32] })
      caps.push({ position: [-2.8, 1.05 - row * .82 - col * .28, -.32], rotation: [Math.PI / 2, 0, 0] })
    }
    return { passives, terminals, caps, inductors, resistor: new THREE.BoxGeometry(.09, .043, .03), terminal: new THREE.BoxGeometry(.038, .05, .028), capacitor: new THREE.CylinderGeometry(.085, .085, .25, 16), inductor: new THREE.BoxGeometry(.34, .35, .3) }
  }, [])
  useEffect(() => () => { resources.resistor.dispose(); resources.terminal.dispose(); resources.capacitor.dispose(); resources.inductor.dispose() }, [resources])
  useFrame(() => {
    const stage = hardwareState(journey.current.progress).vrm * 3
    indicators.current.forEach((indicator, i) => { if (indicator) indicator.emissiveIntensity = activeRole === i ? .65 : Math.max(.02, Math.min(.5, (stage - i) * .5)) })
  })
  return <>
    <Batch geometry={resources.resistor} placements={resources.passives} material={materials.chip} />
    <Batch geometry={resources.terminal} placements={resources.terminals} material={materials.solder} />
    <Batch geometry={resources.capacitor} placements={resources.caps} material={materials.aluminum} />
    <Batch geometry={resources.inductor} placements={resources.inductors} material={materials.shell} />
    {[0, 1, 2].map(i => <group key={i}>
      <Label text={`VRM_${i + 1} / R22`} position={[-3.46, .82 - i * .8, -.161]} width={.8} height={.09} />
      <Part position={[-3.46, .55 - i * .8, -.4]} size={[.72, .15, .035]} material={materials.chip} />
      <mesh position={[-3.96, .82 - i * .8, -.34]}><boxGeometry args={[.02, .36, .03]} /><meshStandardMaterial ref={node => { indicators.current[i] = node }} color="#657752" emissive="#91c867" emissiveIntensity={.02} /></mesh>
    </group>)}
    <mesh position={[3.73, -1.24, -.34]}><boxGeometry args={[.16, .035, .03]} /><meshStandardMaterial ref={node => { indicators.current[3] = node }} color="#657752" emissive="#91c867" emissiveIntensity={.02} /></mesh>
  </>
}

function Memory({ index, active, interactive, onHover, onSelect, reduced, materials, journey }: { index: number; active: boolean; interactive: boolean; onHover: (id: ProjectId | null) => void; onSelect: (id: ProjectId) => void; reduced: boolean; materials: HardwareMaterials; journey: React.RefObject<JourneyState> }) {
  const ref = useRef<THREE.Group>(null!), indicator = useRef<THREE.MeshStandardMaterial>(null!)
  const position = memoryPositions[index], width = projects[index].id === 'cet-vit' ? 1.34 : 1.07
  const contacts = useMemo(() => ({ geometry: new THREE.BoxGeometry(.034, .095, .024), placements: Array.from({ length: 12 }, (_, i) => [-1, 1].map(side => ({ position: [-width * .43 + i * width * .86 / 11, side * .31, -.017] as V3 }))).flat() }), [width])
  useEffect(() => () => contacts.geometry.dispose(), [contacts])
  useFrame(({ clock }, dt) => {
    ref.current.position.z = reduced ? position[2] : THREE.MathUtils.damp(ref.current.position.z, position[2] + (active ? .24 : 0), 7, dt)
    const trained = Math.max(0, Math.min(1, hardwareState(journey.current.progress).memory * projects.length - index))
    indicator.current.emissiveIntensity = active ? .75 : .02 + trained * .32 + (reduced ? 0 : trained * Math.max(0, Math.sin(clock.elapsedTime * .8 - index)) * .03)
  })
  const over = (event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); onHover(projects[index].id) }
  return <group name={`memory-${projects[index].id}`} ref={ref} position={position} onPointerOver={interactive ? over : undefined} onPointerOut={interactive ? () => onHover(null) : undefined} onClick={interactive ? event => { event.stopPropagation(); onSelect(projects[index].id) } : undefined}>
    <Part position={[0, 0, -.03]} size={[width + .09, .69, .04]} material={materials.recess} />
    <Part position={[0, 0, 0]} size={[width, .59, .1]} material={materials.chip} bevel />
    <Batch {...contacts} material={materials.solder} />
    <Label text={projects[index].name.toUpperCase()} position={[0, .075, .129]} width={width * .9} height={.095} color="#a9b1b0" />
    <Label text={`GDDR / VRAM_0${index + 1}`} position={[0, -.105, .129]} width={width * .8} height={.065} color="#68736f" />
    <mesh position={[-width * .38, .227, .128]}><circleGeometry args={[.016, 8]} /><meshStandardMaterial ref={indicator} color="#768d5d" emissive="#a0cb75" /></mesh>
    {active && <group position={[0, .64, .18]}><mesh><planeGeometry args={[1.72, .41]} /><meshBasicMaterial color="#101915" transparent opacity={.91} /></mesh><Label text={`${projects[index].metrics[0].value} / OPEN PROJECT`} position={[0, 0, .005]} width={1.55} height={.085} color="#c4d8b2" /></group>}
  </group>
}

function Connector({ active, materials, onInspect }: { active: boolean; materials: HardwareMaterials; onInspect: (key: string | null) => void }) {
  const ref = useRef<THREE.InstancedMesh>(null!), [hover, setHover] = useState(-1)
  const links = [`mailto:${content.contact.email}`, content.contact.github, content.contact.linkedin, `tel:${content.contact.phone}`]
  useLayoutEffect(() => {
    const matrix = new THREE.Matrix4(), color = new THREE.Color()
    for (let i = 0; i < 48; i++) {
      ref.current.setMatrixAt(i, matrix.makeTranslation(-2.88 + i * .113 + (i > 11 ? .16 : 0), -1.75, -.56))
      ref.current.setColorAt(i, color.set(active && Math.floor(i / 12) === hover ? '#e8dda9' : '#cdb478'))
    }
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [active, hover])
  return <>
    <Part position={[-2.25, -1.69, -.59]} size={[1.42, .55, .095]} material={materials.pcb} />
    <Part position={[.59, -1.69, -.59]} size={[4.15, .55, .095]} material={materials.pcb} />
    <instancedMesh ref={ref} args={[undefined, undefined, 48]} onPointerMove={event => { event.stopPropagation(); onInspect('pcie'); if (active) { setHover(Math.floor((event.instanceId || 0) / 12)); (event.nativeEvent.target as HTMLElement).style.cursor = 'pointer' } }} onPointerOut={event => { setHover(-1); onInspect(null); (event.nativeEvent.target as HTMLElement).style.cursor = '' }} onClick={event => {
      if (!active) return
      event.stopPropagation(); const i = Math.floor((event.instanceId || 0) / 12)
      if (i === 0 || i === 3) window.location.href = links[i]
      else window.open(links[i], '_blank', 'noopener,noreferrer')
    }}><boxGeometry args={[.075, .4, .14]} /><meshStandardMaterial color="#ffffff" metalness={.9} roughness={.25} /></instancedMesh>
    {active && ['EMAIL', 'GITHUB', 'LINKEDIN', 'PHONE'].map((label, i) => <Label key={label} text={label} position={[-2.25 + i * 1.38, -2.14, -.47]} width={.95} height={.12} color={hover === i ? '#c5dca7' : '#9aab98'} />)}
  </>
}

export default function GPUBoard({ materials, reduced, activeRole, activeSkill, activeZone, hovered, onHover, onSelect, onInspect, journey, inspectionMode }: { materials: HardwareMaterials; reduced: boolean; activeRole: number; activeSkill: number; activeZone: number; hovered: ProjectId | null; onHover: (id: ProjectId | null) => void; onSelect: (id: ProjectId) => void; onInspect: (key: string | null) => void; journey: React.RefObject<JourneyState>; inspectionMode: InspectionMode }) {
  const map = usePCBTexture()
  const holes = useMemo<V3[]>(() => [-4.02, 4.02].flatMap(x => [-1.34, 1.34].map(y => [x, y, -.44] as V3)), [])
  const sockets = useMemo(() => ({ geometry: new THREE.BoxGeometry(.074, .17, .087), placements: Array.from({ length: 12 }, (_, i) => ({ position: [2.72 + i % 6 * .11, 1.69, -.4 + Math.floor(i / 6) * .16] as V3 })) }), [])
  useEffect(() => () => sockets.geometry.dispose(), [sockets])
  return <>
    <Part position={[0, 0, -.55]} size={[8.45, 3.04, .11]} material={materials.pcb} />
    <mesh position={[0, 0, -.488]}><planeGeometry args={[8.42, 3.01]} /><meshStandardMaterial map={map} roughness={.72} metalness={.18} /></mesh>
    <Circuitry reduced={reduced} activeSkill={activeSkill} journey={journey} inspectionMode={inspectionMode} />
    <Core materials={materials} active={activeZone === 1 || activeZone === 4} onInspect={onInspect} journey={journey} />
    <Components materials={materials} activeRole={activeRole} journey={journey} />
    {projects.map((project, index) => <Memory key={project.id} index={index} materials={materials} reduced={reduced} interactive={activeZone === 3 && !reduced} active={activeZone === 3 && hovered === project.id} onHover={onHover} onSelect={onSelect} journey={journey} />)}
    <Fasteners positions={holes} material={materials.gold} dark={materials.recess} />
    <Connector active={activeZone === 6} materials={materials} onInspect={onInspect} />
    <group onPointerOver={event => { event.stopPropagation(); onInspect('power') }} onPointerOut={() => onInspect(null)}>
      <Part position={[2.99, 1.52, -.41]} size={[.89, .45, .45]} material={materials.recess} bevel />
      <Batch {...sockets} material={materials.gold} />
      <Part position={[2.99, 1.65, -.12]} size={[.42, .28, .085]} material={materials.chip} />
      <Label text="PWR / 12V" position={[2.99, 1.27, -.15]} width={.72} height={.08} />
    </group>
  </>
}
