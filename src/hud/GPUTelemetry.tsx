import { useEffect, useState, type CSSProperties } from 'react'
import { hardwareState } from '../scene/hardware/state'
import { useThermalDisplay } from '../hooks/useThermalDisplay'
import type { ThermalStore } from '../scene/thermal/simulation'

export default function GPUTelemetry({ reduced, ready, journeyProgress, store }: { reduced: boolean; ready: boolean; journeyProgress: number; store: ThermalStore }) {
  const [online, setOnline] = useState(ready), [history, setHistory] = useState<number[]>(Array(20).fill(28))
  const thermal = useThermalDisplay(store, reduced)
  useEffect(() => {
    if (!ready) { setOnline(false); return }
    if (reduced) { setOnline(true); return }
    const delay = window.setTimeout(() => setOnline(true), 800)
    return () => clearTimeout(delay)
  }, [ready, reduced])
  useEffect(() => {
    if (reduced || !online) return
    const timer = window.setInterval(() => { if (!document.hidden) setHistory(values => [...values.slice(-19), store.current.gpuTemp]) }, 1000)
    return () => clearInterval(timer)
  }, [reduced, online, store])
  const electrical = hardwareState(journeyProgress)
  const operational = electrical.core > .95
  const readings = [
    { label: 'GPU CORE', value: thermal.gpuTemp.toFixed(1), unit: '°C', level: thermal.gpuTemp / 100 },
    { label: 'COOLANT', value: thermal.coolantTemp.toFixed(1), unit: '°C', level: thermal.coolantTemp / 70 },
    { label: 'FAN ARRAY', value: Math.round(thermal.fanRPM), unit: 'RPM', level: thermal.fanRPM / 3200 },
    { label: 'PUMP', value: Math.round(thermal.pumpRPM), unit: 'RPM', level: thermal.pumpRPM / 4500 },
    { label: 'HEAT LOAD', value: Math.round(thermal.heatLoad), unit: '%', level: thermal.heatLoad / 100 },
    { label: 'CORE CLOCK', value: thermal.throttle > .5 ? 1785 : Math.round(1860 * electrical.core), unit: 'MHz', level: electrical.core * .68 },
  ]
  const points = history.map((temp, i) => `${i * 5},${19 - Math.max(0, Math.min(16, (temp - 28) / 4))}`).join(' ')
  const hot = Math.max(0, Math.min(1, (thermal.gpuTemp - 40) / 50))
  return <div className={`telemetry diagnostic-panel ${online ? 'is-online' : ''}`} aria-label="Simulated GPU telemetry" data-online={online} tabIndex={0}>
    <div className="telemetry-title"><span className="status-light" /> THERMAL SENSORS <span>SIMULATED</span></div>
    <dl className="diagnostic-readings">{readings.map(reading => <div key={reading.label}><dt>{reading.label}</dt><dd><span>{online ? reading.value : '—'}</span><small>{reading.unit}</small><i className="telemetry-meter"><b style={{ width: `${online ? Math.min(100, reading.level * 100) : 0}%` }} /></i></dd></div>)}</dl>
    <div className="diagnostic-signal"><span>CORE / LAST 20S</span><svg width="95" height="20" viewBox="0 0 95 20" aria-hidden="true"><polyline points={online ? points : '0,19 95,19'} fill="none" stroke="currentColor" strokeWidth="1" /></svg><b>{thermal.throttle > .5 ? 'THROTTLED' : thermal.surge > .55 ? 'SURGE' : operational ? 'NOMINAL' : 'STANDBY'}</b></div>
    <div className="thermal-mini-map" aria-hidden="true" style={{ '--heat': `${Math.round(hot * 100)}%` } as CSSProperties}><span>IR MAP / CORE</span><i /></div>
    <div className="thermal-loop-path">BLOCK → RADIATOR → RESERVOIR → PUMP → BLOCK</div>
    {(thermal.surge > .65 || thermal.throttle > .5) && <div className="thermal-alert" role="status">{thermal.throttle > .5 ? 'CLOCKS REDUCED: 1785MHz' : 'THERMAL LOAD HIGH'}</div>}
    <div className="telemetry-bottom"><span>LOOP <b>{online ? 'PRIMED' : 'STARTING'}</b></span><span>IR <b>READY</b></span><span className="telemetry-status">{online ? operational ? '● ONLINE' : '○ STANDBY' : '○ INITIALIZING'}</span></div>
  </div>
}
