export interface ThermalState {
  gpuTemp: number
  coolantTemp: number
  fanRPM: number
  pumpRPM: number
  heatLoad: number
  scrollHeat: number
  surge: number
  throttle: number
  priming: number
  hoverPulse: number
  time: number
}

export interface ThermalStore {
  current: ThermalState
  lastProgress: number
  lastZone: number
  transitionHeat: number
  strain: number
  throttledOnce: boolean
  throttleSeconds: number
  lastHovered: boolean
}

export function createThermalStore(): ThermalStore {
  return { current: { gpuTemp: 28, coolantTemp: 28, fanRPM: 0, pumpRPM: 0, heatLoad: 0, scrollHeat: 0, surge: 0, throttle: 0, priming: 0, hoverPulse: 0, time: 0 }, lastProgress: 0, lastZone: 0, transitionHeat: 0, strain: 0, throttledOnce: false, throttleSeconds: 0, lastHovered: false }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const approach = (value: number, target: number, dt: number, tau: number) => value + (target - value) * (1 - Math.exp(-dt / tau))

export function stepThermal(store: ThermalStore, dt: number, progress: number, zone: number, hovered: boolean, powered: boolean, reduced: boolean) {
  const state = store.current
  dt = clamp(dt, 0, .1)
  if (reduced) {
    Object.assign(state, { gpuTemp: 42.3, coolantTemp: 32, fanRPM: 800, pumpRPM: 1800, heatLoad: 22, scrollHeat: 0, surge: 0, throttle: 0, priming: 1, hoverPulse: 0 })
    return state
  }
  state.time += dt
  if (!powered) {
    state.heatLoad = 0
    state.fanRPM = approach(state.fanRPM, 0, dt, .4)
    state.pumpRPM = approach(state.pumpRPM, 0, dt, .4)
    store.lastProgress = progress
    store.lastZone = zone
    return state
  }
  state.priming = clamp(state.priming + dt / 2.1, 0, 1)
  if (hovered && !store.lastHovered) state.hoverPulse = 1
  store.lastHovered = hovered
  state.hoverPulse *= Math.exp(-dt / .9)
  const velocity = Math.abs(progress - store.lastProgress) / Math.max(dt, .001)
  store.lastProgress = progress
  if (zone !== store.lastZone) { store.transitionHeat = 15; store.lastZone = zone }
  store.transitionHeat *= Math.exp(-dt / 2)
  state.scrollHeat = approach(state.scrollHeat, clamp(velocity * 13, 0, 55), dt, .35)
  state.surge = approach(state.surge, velocity > 1.7 ? 1 : 0, dt, velocity > 1.7 ? .15 : 1.2)
  const projectLoad = zone === 3 ? 20 : 0
  state.heatLoad = clamp(22 + state.scrollHeat + store.transitionHeat + (hovered ? 5 : 0) + projectLoad, 0, 100)
  store.strain = clamp(store.strain + dt * (state.heatLoad > 88 ? 2 : -1.3), 0, 12)
  const fanTarget = state.gpuTemp < 45 ? 800 : state.gpuTemp < 75 ? 800 + (state.gpuTemp - 45) / 30 * 1400 : state.gpuTemp < 85 ? 2200 + (state.gpuTemp - 75) / 10 * 1000 : 3200
  state.fanRPM = approach(state.fanRPM, fanTarget * state.priming, dt, .8)
  state.pumpRPM = approach(state.pumpRPM, (1800 + state.heatLoad / 100 * 2700) * state.priming, dt, .65)
  const cooling = (state.fanRPM / 3200 * 3.6 + state.pumpRPM / 4500 * 2.4) * state.priming
  const targetGPU = 28 + state.heatLoad * .65 + store.strain * .6 - cooling
  state.gpuTemp = approach(state.gpuTemp, targetGPU, dt, 3)
  state.coolantTemp = approach(state.coolantTemp, 28 + (state.gpuTemp - 28) * .39 - state.fanRPM / 3200 * 1.7, dt, 4.5)
  if (!store.throttledOnce && state.gpuTemp > 92) { store.throttledOnce = true; store.throttleSeconds = 3 }
  store.throttleSeconds = Math.max(0, store.throttleSeconds - dt)
  state.throttle = approach(state.throttle, store.throttleSeconds > 0 ? 1 : 0, dt, .2)
  return state
}
