import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { HardwareMotion } from './GPU'
import type { InspectionMode } from './hardware/state'
import type { ThermalStore } from './thermal/simulation'

type Annotation = { id: string; label: string; detail: string; anchor: [number, number, number]; offset: [number, number]; layer?: keyof Pick<HardwareMotion, 'shroud' | 'heatsink' | 'backplate'> }
const annotations: Annotation[][] = [
  [
    { id: 'fan', label: 'COOLING ARRAY', detail: '03 × AXIAL / ACTIVE', anchor: [-2.85, 0, .8], offset: [-62, -110], layer: 'shroud' },
    { id: 'thermal', label: 'THERMAL ARRAY', detail: 'ALUMINIUM / Cu HEATPIPES', anchor: [3.8, 1.05, .2], offset: [35, -92], layer: 'heatsink' },
    { id: 'io', label: 'DISPLAY OUTPUTS', detail: '03 DISPLAYPORT / 01 HDMI', anchor: [4.49, 0, .05], offset: [-145, 110] },
    { id: 'pcie', label: 'PCIe INTERFACE', detail: 'x16 / SIGNAL PATH', anchor: [-.6, -1.79, -.47], offset: [-20, 80] },
  ],
  [
    { id: 'core', label: 'GPU CORE', detail: 'SILICON / DJD-2027', anchor: [0, 0, -.32], offset: [72, -100] },
    { id: 'memory', label: 'GDDR MEMORY', detail: 'LOW-LATENCY / LOCAL', anchor: [1.87, -1.03, -.3], offset: [62, 85] },
    { id: 'pcb', label: 'PCB SUBSTRATE', detail: 'SIGNAL / POWER / GROUND', anchor: [-3.75, -1.15, -.5], offset: [-110, 75] },
  ],
  [
    { id: 'vrm', label: 'POWER DELIVERY', detail: 'VRM / MULTIPHASE', anchor: [-3.46, .82, -.2], offset: [-20, -100] },
    { id: 'power', label: '12V INTERFACE', detail: 'REGULATED / STABLE', anchor: [2.99, 1.65, -.1], offset: [15, -70] },
    { id: 'cap', label: 'POWER STAGES', detail: 'INDUCTORS / CAPACITORS', anchor: [-3.65, -.8, -.3], offset: [45, 72] },
  ],
  [
    { id: 'memory', label: 'GDDR MEMORY', detail: '06 WORKLOADS / SELECT TO OPEN', anchor: [-.9, 1.12, -.3], offset: [30, -90] },
    { id: 'core', label: 'COMPUTE CORE', detail: 'RESEARCH → EXECUTION', anchor: [0, 0, -.32], offset: [155, 85] },
    { id: 'pcb', label: 'MEMORY BUS', detail: 'TRACES / LOW-LATENCY PATH', anchor: [2.6, -.2, -.46], offset: [25, 95] },
  ],
  [
    { id: 'core', label: 'GPU CORE', detail: 'SIGNAL / COMPUTE / MEMORY', anchor: [0, 0, -.32], offset: [50, -110] },
    { id: 'bus', label: 'SYSTEM BUS', detail: 'TRACES / CONTINUOUS FLOW', anchor: [2.6, -.2, -.46], offset: [25, 100] },
    { id: 'pcie', label: 'GOLD CONTACTS', detail: 'PCIe x16 / HOST LINK', anchor: [-.6, -1.79, -.47], offset: [-45, 65] },
  ],
  [
    { id: 'backplate', label: 'BACKPLATE', detail: 'MACHINED / ANODIZED Al', anchor: [-2.7, .2, -.9], offset: [55, -100], layer: 'backplate' },
    { id: 'validation', label: 'VALIDATION', detail: 'DJD / RESEARCH EDITION', anchor: [.45, -.2, -.92], offset: [-100, 85], layer: 'backplate' },
    { id: 'thermal', label: 'COOLING VENTS', detail: 'AIRFLOW / HEAT REJECTION', anchor: [3.75, .8, -.88], offset: [-150, 65], layer: 'backplate' },
  ],
  [
    { id: 'pcie', label: 'PCIe x16', detail: 'CONNECTION / ACTIVE', anchor: [-.6, -1.79, -.47], offset: [60, 90] },
    { id: 'power', label: 'SYSTEM ONLINE', detail: 'PORTFOLIO.EXE', anchor: [2.99, 1.65, -.1], offset: [30, -55] },
    { id: 'io', label: 'DISPLAY PORTS', detail: 'DP x3 / HDMI x1', anchor: [4.49, 0, .05], offset: [-145, -85] },
  ],
]
const thermalAnnotations: Annotation[] = [
  { id: 'coldplate', label: 'COLD PLATE / DIE', detail: 'CORE SENSOR', anchor: [0, 0, -.18], offset: [90, -80] },
  { id: 'outlet', label: 'COOLANT OUT', detail: 'HOT LEG → RADIATOR', anchor: [-1.86, 1.8, .46], offset: [-125, -68] },
  { id: 'radiator', label: 'RADIATOR / FIN STACK', detail: 'HEAT REJECTION', anchor: [0, 2.18, .3], offset: [110, -55] },
  { id: 'return', label: 'COOLANT IN', detail: 'PUMP → COLD PLATE', anchor: [2.25, .65, .44], offset: [25, 82] },
]
const inspectCopy: Record<string, string> = { fan: 'FAN ARRAY / RPM FOLLOWS LOAD', core: 'COMPUTE CORE / BLACKWELL INSPIRED', pcie: 'PCIe x16 / ACTIVE', power: '12V / POWER DELIVERY', io: 'DISPLAY OUTPUTS / 3× DP + HDMI' }

export default function GPUAnnotations({ group, motion, zone, startup, inspected, reduced, mode, thermal }: { group: RefObject<THREE.Group | null>; motion: RefObject<HardwareMotion>; zone: number; startup: RefObject<number>; inspected: string | null; reduced: boolean; mode: InspectionMode; thermal: ThermalStore }) {
  const { camera, size, gl } = useThree()
  const svg = useRef<SVGSVGElement>(null), callouts = useRef<(SVGGElement | null)[]>([]), paths = useRef<(SVGPathElement | null)[]>([]), anchors = useRef<(SVGRectElement | null)[]>([]), texts = useRef<(SVGGElement | null)[]>([])
  const dimensions = useRef<SVGGElement>(null), telemetryLine = useRef<SVGPathElement>(null)
  const vector = useMemo(() => new THREE.Vector3(), [])
  const entries = useMemo(() => (mode === 'thermal' ? thermalAnnotations : annotations[zone]).slice(0, size.width < 500 ? 2 : size.width < 900 ? 3 : 4), [zone, size.width, mode])
  // A single SVG overlay, projected from world-space anchors without React updates per frame.
  useLayoutEffect(() => {
    const make = <K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, string>, text?: string) => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', tag)
      Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value))
      if (text) element.textContent = text
      return element
    }
    const overlay = make('svg', { class: 'gpu-annotations', width: `${size.width}`, height: `${size.height}`, 'aria-hidden': 'true' })
    overlay.style.opacity = '0'; overlay.style.zIndex = '2'; svg.current = overlay
    telemetryLine.current = make('path', { class: 'telemetry-tether', fill: 'none' }); overlay.appendChild(telemetryLine.current)
    entries.forEach((entry, i) => {
      const item = make('g', { 'data-component': entry.id })
      const path = make('path', { class: 'annotation-leader', fill: 'none' })
      const anchor = make('rect', { class: 'annotation-anchor', width: '4', height: '4' })
      const label = make('g', {})
      label.append(make('text', { class: 'annotation-label' }, entry.label), make('text', { class: 'annotation-detail', y: '18' }, entry.detail))
      item.append(path, anchor, label); overlay.appendChild(item)
      callouts.current[i] = item; paths.current[i] = path; anchors.current[i] = anchor; texts.current[i] = label
    })
    const dimension = make('g', { opacity: '0', transform: `translate(${size.width * .73},${size.height * .53})` })
    dimension.append(make('path', { class: 'annotation-leader', d: 'M0,-74 V74 M-4,-74 H4 M-4,74 H4' }), make('text', { class: 'annotation-label', x: '10' }, 'LAYER SEPARATION'), make('text', { class: 'annotation-detail', x: '10', y: '17' }, 'SHROUD / SINK / PCB'))
    dimensions.current = dimension; overlay.appendChild(dimension)
    overlay.appendChild(make('text', { class: 'inspect-hint', x: `${size.width * .53}`, y: `${size.height - 27}`, 'text-anchor': 'middle' }, 'INSPECT HARDWARE  +  MOVE POINTER'))
    const parent = gl.domElement.parentElement!
    parent.appendChild(overlay)
    return () => { overlay.remove(); svg.current = null }
  }, [entries, gl, size.width, size.height])
  useEffect(() => {
    const hint = svg.current?.querySelector('.inspect-hint')
    if (hint) { hint.textContent = inspected ? inspectCopy[inspected] : 'INSPECT HARDWARE  +  MOVE POINTER'; hint.classList.toggle('is-inspecting', Boolean(inspected)) }
  }, [inspected, entries, size.width, size.height])
  useFrame(() => {
    if (!group.current || !svg.current) return
    group.current.updateWorldMatrix(true, false)
    svg.current.style.opacity = `${reduced ? .75 : THREE.MathUtils.smoothstep(startup.current, .35, 1)}`
    entries.forEach((entry, i) => {
      vector.set(...entry.anchor); if (entry.layer) vector.z += motion.current[entry.layer]
      vector.applyMatrix4(group.current!.matrixWorld).project(camera)
      const x = (vector.x * .5 + .5) * size.width, y = (-vector.y * .5 + .5) * size.height
      const minX = size.width < 600 ? 15 : 95
      const endX = THREE.MathUtils.clamp(x + entry.offset[0], minX, size.width - 205)
      const endY = THREE.MathUtils.clamp(y + entry.offset[1], 58, size.height - 57)
      const shown = vector.z < 1 && x > 10 && x < size.width - 10 && y > 5 && y < size.height - 5
      callouts.current[i]?.setAttribute('opacity', shown ? '1' : '0')
      paths.current[i]?.setAttribute('d', `M${x},${y} L${endX},${endY + 6} h85`)
      anchors.current[i]?.setAttribute('x', `${x - 2}`); anchors.current[i]?.setAttribute('y', `${y - 2}`)
      texts.current[i]?.setAttribute('transform', `translate(${endX + 5}, ${endY})`)
      if (mode === 'thermal') {
        const detail = texts.current[i]?.children[1]
        if (detail) detail.textContent = entry.id === 'coldplate' ? `${thermal.current.gpuTemp.toFixed(0)}°C / GPU CORE` : entry.id === 'radiator' ? `${(thermal.current.coolantTemp - 3).toFixed(0)}°C / EXHAUST` : `${thermal.current.coolantTemp.toFixed(0)}°C / ${entry.id === 'outlet' ? 'HOT LEG' : 'RETURN'}`
      }
    })
    dimensions.current?.setAttribute('opacity', motion.current.explode > .3 && !reduced ? `${motion.current.explode * .7}` : '0')
    const panel = zone === 0 ? document.querySelector('.hero-telemetry') : null
    if (panel && size.width > 600) {
      const panelBounds = panel.getBoundingClientRect(), bounds = gl.domElement.getBoundingClientRect()
      vector.set(2.85, .4, .8 + motion.current.shroud).applyMatrix4(group.current.matrixWorld).project(camera)
      const x = (vector.x * .5 + .5) * size.width, y = (-vector.y * .5 + .5) * size.height
      const px = panelBounds.left + 17 - bounds.left, py = panelBounds.bottom - bounds.top
      telemetryLine.current?.setAttribute('d', `M${x},${y} L${px},${py + 26} V${py}`)
    } else telemetryLine.current?.setAttribute('d', '')
  })
  return null
}
