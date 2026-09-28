import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import type { ProjectId } from '../content'
import type { JourneyState } from '../hooks/useJourney'
import { cameraStops, type Quality } from './config'
import GPU, { type HardwareMotion } from './GPU'
import GPUEnvironment from './GPUEnvironment'
import GPUAnnotations from './GPUAnnotations'
import GPUPostProcessing from './GPUPostProcessing'
import type { InspectionMode } from './hardware/state'
import ThermalController from './thermal/ThermalController'
import type { CoolantTheme } from './thermal/LiquidLoop'
import type { ThermalStore } from './thermal/simulation'

export interface SceneProps {
  journey: RefObject<JourneyState>; reduced: boolean; powered: boolean; hovered: ProjectId | null
  onHover: (id: ProjectId | null) => void; onSelect: (id: ProjectId) => void
  activeRole: number; activeSkill: number; onReady: () => void; onFailure: () => void; onQuality: (quality: Quality) => void
  inspectionMode: InspectionMode
  thermal: ThermalStore; coolantTheme: CoolantTheme
}

function Rig({ journey, reduced, initialized, group, startup }: { journey: RefObject<JourneyState>; reduced: boolean; initialized: boolean; group: RefObject<THREE.Group | null>; startup: RefObject<number> }) {
  const { camera, size, gl } = useThree()
  const start = useRef(Infinity), pointer = useRef(new THREE.Vector2()), damped = useRef(new THREE.Vector2()), look = useRef(new THREE.Vector3())
  const vectors = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), target: new THREE.Vector3(), position: new THREE.Vector3(), sphericalA: new THREE.Spherical(), sphericalB: new THREE.Spherical(), spherical: new THREE.Spherical() }), [])
  useEffect(() => { if (initialized) start.current = performance.now() }, [initialized])
  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const rect = gl.domElement.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) { pointer.current.set(0, 0); return }
      pointer.current.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2)
    }
    const leave = () => pointer.current.set(0, 0)
    window.addEventListener('pointermove', move, { passive: true }); document.documentElement.addEventListener('pointerleave', leave); window.addEventListener('blur', leave)
    return () => { window.removeEventListener('pointermove', move); document.documentElement.removeEventListener('pointerleave', leave); window.removeEventListener('blur', leave) }
  }, [gl])
  useFrame(({ clock }, dt) => {
    startup.current = reduced ? 1 : THREE.MathUtils.smoothstep(performance.now() - start.current, 0, 2100)
    const progress = reduced ? 0 : journey.current.progress, index = Math.min(5, Math.floor(progress)), fraction = Math.min(1, progress - index)
    const from = cameraStops[index], to = cameraStops[index + 1]
    vectors.a.fromArray(from.position).sub(vectors.target.fromArray(from.target)); vectors.b.fromArray(to.position).sub(vectors.target.fromArray(to.target))
    vectors.sphericalA.setFromVector3(vectors.a); vectors.sphericalB.setFromVector3(vectors.b)
    const framing = Math.max(.98, .98 / (size.width / size.height))
    vectors.spherical.set(THREE.MathUtils.lerp(vectors.sphericalA.radius, vectors.sphericalB.radius, fraction) * framing * (1 + (1 - startup.current) * .035), THREE.MathUtils.lerp(vectors.sphericalA.phi, vectors.sphericalB.phi, fraction), THREE.MathUtils.lerp(vectors.sphericalA.theta, vectors.sphericalB.theta, fraction))
    vectors.target.fromArray(from.target).lerp(vectors.a.fromArray(to.target), fraction)
    vectors.position.setFromSpherical(vectors.spherical).add(vectors.target)
    camera.position.lerp(vectors.position, reduced ? 1 : 1 - Math.exp(-dt * 5))
    look.current.lerp(vectors.target, reduced ? 1 : 1 - Math.exp(-dt * 5)); camera.lookAt(look.current)
    journey.current.transition *= Math.exp(-dt * 5)
    if (reduced) damped.current.set(0, 0)
    else damped.current.lerp(pointer.current, 1 - Math.exp(-dt * 3.8))
    if (group.current) {
      const rotation = from.rotation.map((value, i) => THREE.MathUtils.lerp(value, to.rotation[i], fraction))
      group.current.rotation.set(rotation[0] + (reduced ? 0 : damped.current.y * .052 + (1 - startup.current) * .065), rotation[1] + (reduced ? 0 : damped.current.x * .087 - (1 - startup.current) * .12), rotation[2] - (1 - startup.current) * .045)
      group.current.position.y = reduced ? 0 : Math.sin(clock.elapsedTime * .34) * .023
    }
  })
  return null
}

function Ready({ onReady, onFailure }: Pick<SceneProps, 'onReady' | 'onFailure'>) {
  const { gl, scene, camera, invalidate } = useThree()
  useEffect(() => {
    let cancelled = false
    const lost = (event: Event) => { event.preventDefault(); onFailure() }
    gl.domElement.addEventListener('webglcontextlost', lost)
    Promise.all([document.fonts.ready, gl.compileAsync(scene, camera)]).then(() => { invalidate(); requestAnimationFrame(() => { if (!cancelled) onReady() }) }).catch(onFailure)
    return () => { cancelled = true; gl.domElement.removeEventListener('webglcontextlost', lost) }
  }, [camera, gl, invalidate, onFailure, onReady, scene])
  return null
}

function Diagnostics() {
  const { gl } = useThree()
  const count = useRef(0)
  useEffect(() => { gl.info.autoReset = false; return () => { gl.info.autoReset = true } }, [gl])
  useFrame(() => {
    if (++count.current % 30 === 0) { gl.domElement.dataset.drawCalls = `${gl.info.render.calls}`; gl.domElement.dataset.triangles = `${gl.info.render.triangles}` }
    gl.info.reset()
  })
  return null
}

function initialQuality(): Quality {
  if (innerWidth < 768) return 'low'
  try {
    const probe = document.createElement('canvas').getContext('webgl2', { powerPreference: 'high-performance' })
    const extension = probe?.getExtension('WEBGL_debug_renderer_info')
    const renderer = extension ? String(probe?.getParameter(extension.UNMASKED_RENDERER_WEBGL)) : ''
    probe?.getExtension('WEBGL_lose_context')?.loseContext()
    if (/Iris|UHD|HD Graphics|SwiftShader|llvmpipe/i.test(renderer)) return 'low'
  } catch { return 'low' }
  return 'medium'
}

export default function Scene(props: SceneProps) {
  const [quality, setQuality] = useState<Quality>(initialQuality)
  const [hidden, setHidden] = useState(false), [initialized, setInitialized] = useState(false), [inspected, setInspected] = useState<string | null>(null)
  const group = useRef<THREE.Group>(null), startup = useRef(0), motion = useRef<HardwareMotion>({ shroud: 0, heatsink: 0, backplate: 0, explode: 0 })
  const highRejected = useRef(false)
  const handleReady = useCallback(() => { setInitialized(true); props.onReady() }, [props.onReady])
  useEffect(() => { props.onQuality(quality) }, [quality, props.onQuality])
  useEffect(() => {
    const update = () => setHidden(document.hidden), resize = () => { if (innerWidth < 768) setQuality('low') }
    document.addEventListener('visibilitychange', update); window.addEventListener('resize', resize)
    return () => { document.removeEventListener('visibilitychange', update); window.removeEventListener('resize', resize) }
  }, [])
  return <Canvas camera={{ position: [0, 1.2, 14.1], fov: 38, near: .1, far: 60 }} dpr={quality === 'low' ? 1 : quality === 'medium' ? Math.min(devicePixelRatio, 1.25) : Math.min(devicePixelRatio, 1.5)} frameloop={props.reduced || hidden ? 'demand' : 'always'}
    gl={{ alpha: true, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: new URLSearchParams(location.search).has('capture') }}
    fallback={<span>3D unavailable. The full portfolio is available below.</span>}
    onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.15; gl.setClearColor('#080a09', 0) }} style={{ cursor: props.hovered ? 'pointer' : 'default' }}>
    <Suspense fallback={null}>
      <ThermalController store={props.thermal} journey={props.journey} hovered={Boolean(props.hovered)} powered={props.powered} reduced={props.reduced} />
      <GPUEnvironment quality={quality} reduced={props.reduced} />
      <group ref={group} rotation={[.46, -.36, -.18]}><GPU {...props} quality={quality} activeZone={props.journey.current.zone} startup={startup} motion={motion} onInspect={setInspected} /></group>
      <Rig journey={props.journey} reduced={props.reduced} initialized={initialized} group={group} startup={startup} />
      <GPUAnnotations group={group} motion={motion} startup={startup} zone={props.journey.current.zone} inspected={inspected} reduced={props.reduced} mode={props.inspectionMode} thermal={props.thermal} />
      <GPUPostProcessing quality={quality} journey={props.journey} reduced={props.reduced} />
      {!props.reduced && initialized && !hidden && <PerformanceMonitor bounds={() => [56, 59]} flipflops={3} onIncline={() => {
        if (!highRejected.current && innerWidth > 1000 && navigator.hardwareConcurrency >= 8) setQuality(current => current === 'medium' ? 'high' : current)
      }} onDecline={() => setQuality(current => {
        if (current === 'high') { highRejected.current = true; return 'medium' }
        return 'low'
      })} onFallback={() => setQuality('low')} />}
      <Ready onReady={handleReady} onFailure={props.onFailure} />
      {new URLSearchParams(location.search).has('inspect') && <Diagnostics />}
    </Suspense>
  </Canvas>
}
