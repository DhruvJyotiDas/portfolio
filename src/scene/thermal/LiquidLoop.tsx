import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Batch, Label, Part, type V3 } from '../hardware/primitives'
import type { Quality } from '../config'
import type { ThermalStore } from './simulation'

export type CoolantTheme = 'cyan' | 'green' | 'orange'
const coolants = { cyan: '#42e9f1', green: '#9ffc63', orange: '#ff9b48' }

const vertex = `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`
const fragment = `uniform float uTime; uniform float uPump; uniform float uFlow; uniform float uOpacity; uniform float uIR; uniform vec3 uCool; uniform vec3 uHot; varying vec2 vUv;
void main(){float flow=vUv.x*uFlow-uTime*uPump*.00023; float ripple=sin(flow*65.+sin(vUv.y*17.+flow*9.)*1.8)*.12+sin(flow*127.-vUv.y*28.)*.06; float streak=pow(max(0.,sin(flow*32.+vUv.y*11.)),14.)*.65; vec3 base=mix(uHot,uCool,smoothstep(0.,1.,vUv.x)); vec3 color=base*(.78+ripple+streak); color=mix(color,vec3(.94,.99,.65)*(1.+streak),uIR*.36); gl_FragColor=vec4(color,uOpacity); }`

function tubeMaterial(direction: number) {
  return new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uPump: { value: 0 }, uFlow: { value: direction }, uOpacity: { value: .9 }, uIR: { value: 0 }, uCool: { value: new THREE.Color(coolants.cyan) }, uHot: { value: new THREE.Color('#ff9658') } }, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
}

export default function LiquidLoop({ store, quality, reduced, theme, ir }: { store: ThermalStore; quality: Quality; reduced: boolean; theme: CoolantTheme; ir: boolean }) {
  const rotors = useRef<(THREE.Group | null)[]>([]), blur = useRef<(THREE.MeshBasicMaterial | null)[]>([]), impeller = useRef<THREE.Group>(null), bubbles = useRef<THREE.InstancedMesh>(null)
  const liquid = useRef<THREE.MeshBasicMaterial>(null), block = useRef<THREE.MeshPhysicalMaterial>(null), reservoir = useRef<THREE.Mesh>(null), pumpRing = useRef<THREE.MeshBasicMaterial>(null), airflow = useRef<THREE.InstancedMesh>(null)
  const colors = useMemo(() => ({ cool: new THREE.Color(), hot: new THREE.Color() }), [])
  const resources = useMemo(() => {
    const curves = [
      new THREE.CatmullRomCurve3([[.57,.34,-.18], [.7,1.11,.36], [-1.86,1.8,.46], [-2.04,2.18,.27]].map(p => new THREE.Vector3(...p))),
      new THREE.CatmullRomCurve3([[-2.04,2.18,.27], [-.75,2.17,.28], [.65,2.17,.28], [2.05,2.18,.27]].map(p => new THREE.Vector3(...p))),
      new THREE.CatmullRomCurve3([[2.05,2.18,.27], [2.62,2.28,.38], [3.43,1.92,.48], [3.43,1.28,.48]].map(p => new THREE.Vector3(...p))),
      new THREE.CatmullRomCurve3([[3.43,1.28,.48], [3.32,.56,.48], [1.55,.6,.42], [-.56,.34,-.18]].map(p => new THREE.Vector3(...p))),
    ]
    const tubes = curves.map(curve => ({ outer: new THREE.TubeGeometry(curve, quality === 'low' ? 28 : 56, .078, 7, false), inner: new THREE.TubeGeometry(curve, quality === 'low' ? 28 : 56, .053, 7, false) }))
    const materials = curves.map(() => tubeMaterial(1))
    const fins = { geometry: new THREE.BoxGeometry(.018, .72, .23), placements: Array.from({ length: quality === 'low' ? 30 : 88 }, (_, i) => ({ position: [-2.02 + i * 4.04 / (quality === 'low' ? 29 : 87), 2.18, .12] as V3 })) }
    const channels = { geometry: new THREE.BoxGeometry(.018, .8, .027), placements: Array.from({ length: 23 }, (_, i) => ({ position: [-.42 + i * .038, 0, -.217] as V3 })) }
    const fanBlades = { geometry: new THREE.BoxGeometry(.14, .29, .018), placements: Array.from({ length: 7 }, (_, i) => ({ position: [0, .21, .025] as V3, rotation: [0, 0, i * Math.PI * 2 / 7] as V3 })) }
    return { curves, tubes, materials, fins, channels, fanBlades, bubbleGeometry: new THREE.SphereGeometry(.023, 6, 5) }
  }, [quality])
  useEffect(() => () => { resources.tubes.forEach(t => { t.outer.dispose(); t.inner.dispose() }); resources.materials.forEach(m => m.dispose()); resources.fins.geometry.dispose(); resources.channels.geometry.dispose(); resources.fanBlades.geometry.dispose(); resources.bubbleGeometry.dispose() }, [resources])
  const shell = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#b9d0d2', metalness: .58, roughness: .22, transparent: true, opacity: .34, depthWrite: false }), [])
  const bubblesMaterial = useMemo(() => quality === 'low' ? new THREE.MeshBasicMaterial({ color: '#e8ffff', transparent: true, opacity: .52 }) : new THREE.MeshPhysicalMaterial({ color: '#e8ffff', transparent: true, opacity: .67, transmission: .82, ior: 1.33, roughness: .08 }), [quality])
  const airMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#b8efea', transparent: true, opacity: .24, depthWrite: false }), [])
  const bladeMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#364346', metalness: .28, roughness: .55, transparent: true, opacity: 1 }), [])
  const shimmer = useMemo(() => new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uHeat: { value: 0 } }, vertexShader: vertex, fragmentShader: 'uniform float uTime;uniform float uHeat;varying vec2 vUv;void main(){float wave=sin(vUv.x*38.+uTime*1.7+sin(vUv.y*16.+uTime)*2.);float fade=sin(vUv.y*3.14159);gl_FragColor=vec4(.55,.92,.88,abs(wave)*fade*uHeat*.085);}', transparent: true, depthWrite: false, side: THREE.DoubleSide }), [])
  useEffect(() => () => { shell.dispose(); bubblesMaterial.dispose(); airMaterial.dispose(); bladeMaterial.dispose(); shimmer.dispose() }, [shell, bubblesMaterial, airMaterial, bladeMaterial, shimmer])
  const object = useMemo(() => new THREE.Object3D(), [])
  const count = quality === 'low' ? 8 : 22
  const airCount = quality === 'low' ? 6 : 16
  useFrame((_, dt) => {
    const s = store.current
    const cool = colors.cool.set(coolants[theme]); const hot = colors.hot.setHSL(THREE.MathUtils.lerp(.49, .04, THREE.MathUtils.clamp((s.gpuTemp - 48) / 43, 0, 1)), .9, .63)
    resources.materials.forEach((m, i) => {
      m.uniforms.uTime.value = s.time
      m.uniforms.uPump.value = s.pumpRPM
      m.uniforms.uOpacity.value = .22 + s.priming * (quality === 'low' ? .58 : .72)
      m.uniforms.uIR.value = ir ? 1 : 0
      m.uniforms.uCool.value.copy(cool)
      m.uniforms.uHot.value.copy(i >= 2 ? cool : hot)
    })
    if (liquid.current) { liquid.current.color.copy(cool); liquid.current.opacity = .2 + .48 * s.priming }
    if (block.current) { block.current.color.copy(cool).lerp(hot, THREE.MathUtils.clamp((s.gpuTemp - 45) / 50, 0, 1) * .55); block.current.emissive.copy(hot); block.current.emissiveIntensity = .05 + s.heatLoad / 500 }
    if (reservoir.current) { reservoir.current.scale.y = 1 + Math.sin(s.time * 7) * s.scrollHeat / 1800; reservoir.current.position.y = .92 + (reservoir.current.scale.y - 1) * .1 }
    if (pumpRing.current) { pumpRing.current.color.copy(cool); pumpRing.current.opacity = .18 + .22 * s.priming + Math.sin(s.time * s.pumpRPM / 60) * .06 * s.priming }
    shimmer.uniforms.uTime.value = s.time; shimmer.uniforms.uHeat.value = THREE.MathUtils.clamp((s.coolantTemp - 32) / 28, 0, 1)
    if (!reduced) {
      rotors.current.forEach((rotor, i) => { if (rotor) rotor.rotation.z -= dt * s.fanRPM * Math.PI / 30 * (i ? -1 : 1) * (1 - s.throttle * .3) })
      if (impeller.current) impeller.current.rotation.z += dt * s.pumpRPM * Math.PI / 30
    }
    blur.current.forEach(material => { if (material) material.opacity = quality === 'low' ? .28 * s.priming : THREE.MathUtils.clamp((s.fanRPM - 1200) / 1600, 0, .37) })
    bladeMaterial.opacity = quality === 'low' ? .75 : 1 - THREE.MathUtils.clamp((s.fanRPM - 1200) / 1600, 0, .78)
    if (bubbles.current) {
      for (let i = 0; i < count; i++) {
        const curve = resources.curves[i % 4]
        const t = reduced ? i / count : (s.time * (.03 + s.pumpRPM / 180000) + i * .173) % 1
        curve.getPointAt(t, object.position)
        const scale = .55 + (i % 3) * .18
        object.scale.setScalar(scale * s.priming); object.updateMatrix()
        bubbles.current.setMatrixAt(i, object.matrix)
      }
      bubbles.current.instanceMatrix.needsUpdate = true
    }
    if (airflow.current) {
      for (let i = 0; i < airCount; i++) {
        const phase = reduced ? i / airCount : (s.time * s.fanRPM / 5000 + i * .371) % 1
        object.position.set(-1.85 + i / (airCount - 1) * 3.7, 2.17 + phase * .55, .52 + phase * .15)
        object.scale.set(.38, 1.6, .38); object.updateMatrix(); airflow.current.setMatrixAt(i, object.matrix)
      }
      airflow.current.instanceMatrix.needsUpdate = true
    }
  })
  return <group>
    {/* Nickel cold plate, TIM, acrylic window and micro-fin channels on the silicon die. */}
    <Part position={[0, 0, -.282]} size={[1.55, 1.36, .035]} material={shell} bevel />
    <mesh position={[0, 0, -.255]}><boxGeometry args={[1.38, 1.19, .04]} /><meshPhysicalMaterial ref={block} color="#71cfd5" transparent opacity={.44} transmission={quality === 'high' ? .25 : 0} metalness={.14} roughness={.1} clearcoat={1} emissive="#44ddde" emissiveIntensity={.08} depthWrite={false} /></mesh>
    <Batch {...resources.channels} material={shell} />
    <mesh position={[0, 0, -.201]}><planeGeometry args={[1.18, 1]} /><meshBasicMaterial ref={liquid} color="#4ce9ea" transparent opacity={.2} depthWrite={false} /></mesh>
    <Label text="COLD PLATE / MICROFINS" position={[0, -.52, -.174]} width={1.13} height={.08} color="#d4fcf1" />
    {resources.tubes.map((tube, i) => <group key={i}><mesh geometry={tube.outer} material={shell} /><mesh geometry={tube.inner} material={resources.materials[i]} /></group>)}
    <instancedMesh ref={bubbles} args={[resources.bubbleGeometry, bubblesMaterial, count]} frustumCulled={false} />
    {/* The radiator exchanges heat before coolant enters the reservoir and pump. */}
    <Part position={[0, 2.18, .06]} size={[4.34, .9, .24]} material={shell} bevel />
    <Batch {...resources.fins} material={shell} />
    <instancedMesh ref={airflow} args={[resources.bubbleGeometry, airMaterial, airCount]} frustumCulled={false} />
    {quality !== 'low' && <mesh position={[0, 2.77, .34]} material={shimmer}><planeGeometry args={[4.1, .72]} /></mesh>}
    {[-1, 1].map((side, i) => <group key={side} position={[side * 1.04, 2.18, .33]}>
      <mesh><torusGeometry args={[.39, .045, 7, 32]} /><meshStandardMaterial color="#717d80" metalness={.86} roughness={.31} /></mesh>
      {quality !== 'low' && <group ref={node => { rotors.current[i] = node }}><Batch {...resources.fanBlades} material={bladeMaterial} /></group>}
      <mesh position={[0, 0, .052]}><circleGeometry args={[.36, 32]} /><meshBasicMaterial ref={node => { blur.current[i] = node }} color="#a7d9cf" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} /></mesh>
    </group>)}
    <mesh position={[3.43, 1.1, .5]}><cylinderGeometry args={[.22, .22, .88, 20]} /><meshPhysicalMaterial color="#b7e9e5" metalness={.06} roughness={.14} transparent opacity={.33} depthWrite={false} /></mesh>
    <mesh ref={reservoir} position={[3.43, .92, .5]}><cylinderGeometry args={[.195, .195, .48, 20]} /><meshBasicMaterial color={coolants[theme]} transparent opacity={.48} /></mesh>
    <mesh position={[3.43, .55, .5]}><cylinderGeometry args={[.32, .32, .2, 24]} /><meshStandardMaterial color="#5d7272" metalness={.85} roughness={.31} /></mesh>
    <group ref={impeller} position={[3.43, .68, .68]}>{[0, 1, 2, 3].map(i => <mesh key={i} rotation={[0, 0, i * Math.PI / 2]} position={[0, .1, 0]}><boxGeometry args={[.055, .17, .018]} /><meshBasicMaterial color={coolants[theme]} /></mesh>)}</group>
    <mesh position={[3.43, .55, .62]}><torusGeometry args={[.29, .018, 5, 32]} /><meshBasicMaterial ref={pumpRing} color={coolants[theme]} transparent opacity={.22} depthWrite={false} /></mesh>
    <Label text="OUT / HOT" position={[-1.62, 1.78, .57]} width={.65} height={.1} color="#ffc886" />
    <Label text="IN / COOL" position={[2.23, .64, .57]} width={.68} height={.1} color="#9ff9ee" />
    <Label text="RADIATOR / 240" position={[0, 2.66, .3]} width={1.2} height={.12} color="#c5e6df" />
    {ir && <><mesh position={[0, 0, -.34]}><planeGeometry args={[1.48, 1.3]} /><meshBasicMaterial color="#ffef88" transparent opacity={.18} depthWrite={false} /></mesh><Label text="TIM / VAPOR CHAMBER" position={[0, .65, -.17]} width={1.18} height={.09} color="#fff7d3" /></>}
  </group>
}
