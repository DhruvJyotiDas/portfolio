import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { zones, type ProjectId, projects } from './content'
import { Boot, Header, Hud, Telemetry, ThermalPowerLog } from './hud/Hud'
import { useJourney } from './hooks/useJourney'
import { useAudio, useReducedMotion } from './hooks/usePreferences'
import Sections from './sections/Sections'
import ProjectDialog from './sections/ProjectDialog'
import type { Quality } from './scene/config'
import type { InspectionMode } from './scene/hardware/state'
import { createThermalStore } from './scene/thermal/simulation'
import type { CoolantTheme } from './scene/thermal/LiquidLoop'

const Scene = lazy(() => import('./scene/Scene'))

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFailure() }
  render() { return this.state.failed ? null : this.props.children }
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  useEffect(() => { if (window.localStorage.getItem('gpu-theme') === 'light') setTheme('light') }, [])
  useEffect(() => { document.documentElement.dataset.theme = theme; window.localStorage.setItem('gpu-theme', theme) }, [theme])
  const [mounted, setMounted] = useState(false)
  const [fallback, setFallback] = useState(false)
  const [ready, setReady] = useState(false)
  const [entered, setEntered] = useState(false)
  const [loading, setLoading] = useState(15)
  const [hovered, setHovered] = useState<ProjectId | null>(null)
  const [selected, setSelected] = useState<ProjectId | null>(null)
  const [activeRole, setActiveRole] = useState(-1)
  const [activeSkill, setActiveSkill] = useState(-1)
  const [quality, setQuality] = useState<Quality>('medium')
  const [inspectionMode, setInspectionMode] = useState<InspectionMode>('exterior')
  const [coolantTheme, setCoolantTheme] = useState<CoolantTheme>('cyan')
  const thermal = useMemo(createThermalStore, [])
  const reduced = useReducedMotion()
  const { journey, activeZone, progress } = useJourney(reduced || fallback)
  const workload = activeZone === 3 ? projects.find(project => project.id === hovered) : null
  const { enabled: audio, toggle, play } = useAudio()
  const previousZone = useRef(0)
  const onReady = useCallback(() => { setReady(true); setLoading(100) }, [])
  const onFailure = useCallback(() => { setFallback(true); setReady(true); setEntered(true) }, [])
  const enter = useCallback(() => setEntered(true), [])
  const select = useCallback((id: ProjectId) => { setSelected(id); setEntered(true) }, [])
  useEffect(() => {
    setMounted(true)
    setLoading(35)
    document.fonts.ready.then(() => setLoading(value => Math.max(value, 70)))
    try {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('webgl2')
      if (!context) onFailure()
      else context.getExtension('WEBGL_lose_context')?.loseContext()
    } catch { onFailure() }
  }, [onFailure])
  useEffect(() => {
    if (ready) return
    const timeout = setTimeout(onFailure, 20000)
    return () => clearTimeout(timeout)
  }, [ready, onFailure])
  useEffect(() => {
    if (entered) return
    const key = (event: KeyboardEvent) => { if ((event.key === 'Enter' || event.key === ' ') && event.target === document.body) enter() }
    window.addEventListener('wheel', enter, { passive: true, once: true })
    window.addEventListener('touchstart', enter, { passive: true, once: true })
    window.addEventListener('keydown', key)
    return () => { window.removeEventListener('wheel', enter); window.removeEventListener('touchstart', enter); window.removeEventListener('keydown', key) }
  }, [entered, enter])
  useEffect(() => {
    if (activeZone !== previousZone.current && audio && !reduced) play()
    previousZone.current = activeZone
  }, [activeZone, audio, reduced, play])
  useEffect(() => { if (reduced) setEntered(true) }, [reduced])
  useEffect(() => {
    if (!ready || entered) return
    const timer = window.setTimeout(enter, 1900)
    return () => clearTimeout(timer)
  }, [ready, entered, enter])
  return <div className={`app ${mounted ? 'is-enhanced' : ''} ${fallback || reduced ? 'static-mode' : ''}`} data-theme={theme} data-quality={quality} data-scene-ready={ready} data-zone={activeZone} data-inspection-mode={inspectionMode}>
    <div className="scene-backdrop" aria-hidden="true"><div className="ambient-glow" /><div className="scene-grid" />{(!mounted || fallback) && <img className="static-gpu" src={`${import.meta.env.BASE_URL}og-gpu.png`} alt="" />}</div>
    {mounted && !fallback && <div className="scene-canvas" aria-hidden="true"><SceneBoundary onFailure={onFailure}><Suspense fallback={null}><Scene journey={journey} reduced={reduced} powered={entered} hovered={hovered} onHover={setHovered} onSelect={select} activeRole={activeRole} activeSkill={activeSkill} inspectionMode={inspectionMode} coolantTheme={coolantTheme} thermal={thermal} onReady={onReady} onFailure={onFailure} onQuality={setQuality} /></Suspense></SceneBoundary></div>}
    <Header activeZone={activeZone} onNavigate={enter} theme={theme} onToggleTheme={() => setTheme(current => current === 'dark' ? 'light' : 'dark')} />
    <div className="zone-indicator"><span>ZONE {zones[activeZone].number}</span><i />{zones[activeZone].hardware}<span className="zone-indicator-cross">+</span></div>
    <ThermalPowerLog store={thermal} journey={journey} workload={workload?.name} projectCount={projects.length} reduced={reduced} />
    <Sections onSelect={select} onHover={setHovered} onRole={setActiveRole} onSkill={setActiveSkill} onNavigate={enter} />
    {activeZone === 0 && <div className="hero-telemetry"><Telemetry reduced={reduced} ready={ready || !mounted} journeyProgress={journey.current.progress} store={thermal} /></div>}
    {mounted && !entered && !fallback && <Boot progress={loading} ready={ready} onEnter={enter} onSkip={onFailure} />}
    <Hud activeZone={activeZone} progress={progress} audio={audio} onToggle={() => void toggle()} fallback={fallback || reduced} inspectionMode={inspectionMode} onInspectionMode={setInspectionMode} coolantTheme={coolantTheme} onCoolantTheme={() => setCoolantTheme(current => current === 'cyan' ? 'green' : current === 'green' ? 'orange' : 'cyan')} thermal={thermal} onNavigate={enter} />
    <ProjectDialog project={projects.find(project => project.id === selected) || null} onClose={() => setSelected(null)} reduced={reduced} />
  </div>
}
