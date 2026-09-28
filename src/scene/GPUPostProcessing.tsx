import { useMemo, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Bloom, ChromaticAberration, EffectComposer, SMAA, SSAO, Vignette } from '@react-three/postprocessing'
import { Vector2 } from 'three'
import type { Quality } from './config'
import type { JourneyState } from '../hooks/useJourney'

export default function GPUPostProcessing({ quality, journey, reduced }: { quality: Quality; journey: RefObject<JourneyState>; reduced: boolean }) {
  const offset = useMemo(() => new Vector2(), [])
  useFrame(() => offset.setScalar(reduced ? 0 : journey.current.transition * .00016))
  if (quality === 'low') return null
  return <EffectComposer key={quality} multisampling={0} enableNormalPass={quality === 'high'}>
    <Bloom intensity={.16} luminanceThreshold={1.5} mipmapBlur />
    <Vignette eskil={false} offset={.35} darkness={.14} />
    <ChromaticAberration offset={offset} radialModulation modulationOffset={.6} />
    <SMAA />
    {quality === 'high' ? <SSAO samples={8} rings={3} radius={.045} intensity={.65} luminanceInfluence={.65} resolutionScale={.5} /> : <></>}
  </EffectComposer>
}
