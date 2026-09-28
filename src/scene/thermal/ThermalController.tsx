import { useFrame } from '@react-three/fiber'
import type { RefObject } from 'react'
import type { JourneyState } from '../../hooks/useJourney'
import { stepThermal, type ThermalStore } from './simulation'

export default function ThermalController({ store, journey, hovered, powered, reduced }: { store: ThermalStore; journey: RefObject<JourneyState>; hovered: boolean; powered: boolean; reduced: boolean }) {
  useFrame((_, dt) => { stepThermal(store, dt, journey.current.progress, journey.current.zone, hovered, powered, reduced) }, -1)
  return null
}
