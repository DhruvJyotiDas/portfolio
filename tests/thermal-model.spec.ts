import { expect, test } from '@playwright/test'
import { createThermalStore, stepThermal } from '../src/scene/thermal/simulation'

test('one thermal state drives warm-up, fan response, and cooldown', () => {
  const store = createThermalStore()
  for (let i = 0; i < 400; i++) stepThermal(store, .025, 0, 0, false, true, false)
  const idle = { ...store.current }
  expect(idle.heatLoad).toBeCloseTo(22, 0)
  expect(idle.gpuTemp).toBeGreaterThan(35)
  expect(idle.fanRPM).toBeGreaterThan(700)
  expect(idle.pumpRPM).toBeGreaterThan(1800)
  for (let i = 0; i < 300; i++) stepThermal(store, .025, 3.3, 3, true, true, false)
  expect(store.current.heatLoad).toBeGreaterThan(idle.heatLoad)
  expect(store.current.gpuTemp).toBeGreaterThan(idle.gpuTemp)
  const loaded = store.current.gpuTemp
  for (let i = 0; i < 500; i++) stepThermal(store, .025, 0, 0, false, true, false)
  expect(store.current.gpuTemp).toBeLessThan(loaded)
  stepThermal(store, .016, 3.3, 3, true, true, false)
  expect(store.current.hoverPulse).toBeGreaterThan(.9)
})

test('rapid travel causes a decaying surge and throttle can fire only once', () => {
  const store = createThermalStore()
  stepThermal(store, .016, 0, 0, false, true, false)
  stepThermal(store, .016, 2.8, 2, false, true, false)
  expect(store.current.heatLoad).toBeGreaterThan(22)
  expect(store.current.surge).toBeGreaterThan(0)
  for (let i = 0; i < 200; i++) stepThermal(store, .016, 2.8, 2, false, true, false)
  expect(store.current.surge).toBeLessThan(.2)
  store.current.gpuTemp = 93
  stepThermal(store, .016, 2.8, 2, false, true, false)
  expect(store.throttledOnce).toBe(true)
  expect(store.throttleSeconds).toBeGreaterThan(0)
  store.throttleSeconds = 0
  stepThermal(store, .016, 2.8, 2, false, true, false)
  expect(store.throttleSeconds).toBe(0)
})
