// Reversible electrical reveal driven by the 0–6 scroll journey.
// Temperatures, heat load, fans and pump live exclusively in thermal/simulation.ts.
export interface HardwareState {
  power: number
  vrm: number
  core: number
  memory: number
  compute: number
  output: number
  voltage: number
  phase: string
}
export type InspectionMode = 'exterior' | 'xray' | 'signal' | 'thermal'

function ramp(value: number, start: number, end: number) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)))
  return t * t * (3 - 2 * t)
}

export function hardwareState(progress: number): HardwareState {
  const power = ramp(progress, 1.12, 2.12)
  const vrm = ramp(progress, 1.5, 2.47)
  const core = ramp(progress, 1.82, 2.85)
  const memory = ramp(progress, 2.55, 3.48)
  const compute = ramp(progress, 2.84, 3.85)
  const output = ramp(progress, 5.17, 6)
  const voltage = Math.round(.92 * core * 100) / 100
  const phase = progress < .45 ? 'STANDBY' : progress < 1.2 ? 'ARCHITECTURE' : progress < 2.35 ? 'POWER DELIVERY' : progress < 2.85 ? 'CORE BOOT' : progress < 3.5 ? 'MEMORY TRAINING' : progress < 4.55 ? 'COMPUTE / THERMAL' : progress < 5.3 ? 'SYSTEM STABLE' : 'CONNECTION'
  return { power, vrm, core, memory, compute, output, voltage, phase }
}
