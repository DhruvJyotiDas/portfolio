import { useEffect, useState } from 'react'
import { stepThermal, type ThermalState, type ThermalStore } from '../scene/thermal/simulation'

export function useThermalDisplay(store: ThermalStore, reduced = false) {
  const [display, setDisplay] = useState<ThermalState>({ ...store.current })
  useEffect(() => {
    if (reduced) { stepThermal(store, 0, 0, 0, false, true, true); setDisplay({ ...store.current }); return }
    const timer = window.setInterval(() => { if (!document.hidden) setDisplay({ ...store.current }) }, 120)
    return () => clearInterval(timer)
  }, [store, reduced])
  return display
}
