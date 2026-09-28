import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUpRight, AudioLines, Cpu, Menu, Moon, Sun, VolumeX, X } from 'lucide-react'
import { content, zones } from '../content'
import type { InspectionMode } from '../scene/hardware/state'
import { hardwareState } from '../scene/hardware/state'
import { useThermalDisplay } from '../hooks/useThermalDisplay'
import type { ThermalStore } from '../scene/thermal/simulation'
import type { CoolantTheme } from '../scene/thermal/LiquidLoop'
import type { JourneyState } from '../hooks/useJourney'
import type { RefObject } from 'react'

export function Header({ activeZone, onNavigate, theme, onToggleTheme }: { activeZone: number; onNavigate: () => void; theme: 'dark' | 'light'; onToggleTheme: () => void }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open])
  return <header className="site-header">
    <a className="wordmark" href="#overview" aria-label="Dhruv Jyoti Das, home" onClick={onNavigate}><span className="logo-mark"><Cpu size={19} strokeWidth={1.5} /></span><strong>DJD<span className="lime">.</span></strong><span className="wordmark-divider" /><span className="wordmark-sub">THE COMPUTE<br />PORTFOLIO / 2026</span></a>
    <nav className={`main-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
      {[0, 1, 2, 3, 4].map(index => <a key={zones[index].id} href={`#${zones[index].id}`} aria-current={activeZone === index ? 'location' : undefined} onClick={() => { setOpen(false); onNavigate() }}><span className="nav-dot" />{zones[index].label}</a>)}
      <a href="#contact" className="mobile-contact" onClick={() => { setOpen(false); onNavigate() }}>Contact <ArrowUpRight size={14} /></a>
    </nav>
    <div className="header-actions"><button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} aria-pressed={theme === 'light'} title={theme === 'dark' ? 'Light theme' : 'Dark theme'}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}<span>{theme === 'dark' ? 'LIGHT' : 'DARK'}</span></button><a className="header-contact" href="#contact" onClick={onNavigate}>Let’s connect <ArrowUpRight size={15} /></a></div>
    <button className="menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
  </header>
}

export { default as Telemetry } from './GPUTelemetry'

export function ThermalPowerLog({ store, journey, workload, projectCount, reduced }: { store: ThermalStore; journey: RefObject<JourneyState>; workload?: string; projectCount: number; reduced: boolean }) {
  const thermal = useThermalDisplay(store, reduced)
  const hardware = hardwareState(journey.current.progress)
  return <div className="power-log" aria-label="Simulated GPU power sequence"><span>PORTFOLIO.EXE / {workload ? `WORKLOAD ${workload.toUpperCase()}` : hardware.phase}</span><strong>VCORE {hardware.voltage.toFixed(2)}V <i /> VRM {Math.round(hardware.vrm * 3)}/3 <i /> MEM {Math.round(hardware.memory * projectCount)}/{projectCount}</strong><small>LOAD {Math.round(thermal.heatLoad)}% · {thermal.gpuTemp.toFixed(1)}°C · FAN {Math.round(thermal.fanRPM)} RPM / SIMULATED</small></div>
}

export function Hud({ activeZone, progress, audio, onToggle, fallback, onNavigate, inspectionMode, onInspectionMode, coolantTheme, onCoolantTheme, thermal }: { activeZone: number; progress: number; audio: boolean; onToggle: () => void; fallback: boolean; onNavigate: () => void; inspectionMode: InspectionMode; onInspectionMode: (mode: InspectionMode) => void; coolantTheme: CoolantTheme; onCoolantTheme: () => void; thermal: ThermalStore }) {
  const state = useThermalDisplay(thermal, fallback)
  return <>
    <aside className="zone-rail" aria-label="GPU zones">{zones.map((zone, index) => <a key={zone.id} href={`#${zone.id}`} aria-label={`${zone.number}: ${zone.label}`} aria-current={index === activeZone ? 'location' : undefined} onClick={onNavigate}><span>{zone.label}</span><i /></a>)}</aside>
    <div className="bottom-hud">
      <div className="hud-left"><button onClick={onToggle} aria-pressed={audio} aria-label={audio ? 'Mute sound' : 'Enable sound'}>{audio ? <AudioLines size={15} /> : <VolumeX size={15} />}<span>SOUND {audio ? 'ON' : 'OFF'}</span></button><span className="hud-divider" /><span className="render-status"><i className="status-light" />{fallback ? 'STATIC EXPERIENCE' : 'RENDERED IN REAL TIME'}</span>{!fallback && <div className="inspection-controls" aria-label="GPU inspection view">{(['exterior', 'xray', 'signal', 'thermal'] as const).map(mode => <button key={mode} type="button" aria-label={`${mode} inspection view`} aria-pressed={inspectionMode === mode} onClick={() => onInspectionMode(mode)}>{mode === 'thermal' ? 'IR VIEW' : mode.toUpperCase()}</button>)}<button className="coolant-toggle" type="button" aria-label={`Coolant color: ${coolantTheme}. Change color`} onClick={onCoolantTheme}>COOLANT / {coolantTheme.toUpperCase()}</button></div>}</div>
      <a className="scroll-prompt" href={`#${zones[Math.min(activeZone + 1, 6)].id}`} onClick={onNavigate}>{activeZone === 6 ? 'CONNECTION ESTABLISHED' : 'SCROLL TO EXPLORE'}<ArrowDown size={13} /></a>
      <div className="bus-load" data-scroll-progress={progress}><span>THERMAL LOAD</span><div><i style={{ width: `${state.heatLoad}%` }} /></div><b>{String(Math.round(state.heatLoad)).padStart(2, '0')}%</b></div>
    </div>
    <a className="skip-link" href="#main-content">Skip to portfolio content</a>
  </>
}

export function Boot({ ready, progress, onEnter, onSkip }: { ready: boolean; progress: number; onEnter: () => void; onSkip: () => void }) {
  return <div className={`boot-terminal ${ready ? 'boot-ready' : ''}`} role="status" aria-live="polite">
    <span className="boot-title"><Cpu size={14} /> DHRUV.GPU / {ready ? 'SYSTEM READY' : 'INITIALIZING'}</span>
    {!ready && <><div className="boot-progress"><i style={{ width: `${progress}%` }} /></div><span className="boot-detail">{progress < 35 ? 'LOADING COMPUTE ENGINE' : progress < 70 ? 'PREPARING TYPOGRAPHY' : 'COMPILING SHADERS'} <b>{progress}%</b></span></>}
    {ready ? <button onClick={onEnter}>PRESS / SCROLL TO POWER ON <ArrowUpRight size={14} /></button> : <button className="boot-skip" onClick={onSkip}>Continue with static portfolio ↗</button>}
  </div>
}

export function ContactLinks() {
  return <div className="contact-links">
    <a href={`mailto:${content.contact.email}`}><span>01 / EMAIL</span><strong>{content.contact.email}</strong><ArrowUpRight /></a>
    <a href={content.contact.github} target="_blank" rel="noreferrer"><span>02 / GITHUB</span><strong>DhruvJyotiDas</strong><ArrowUpRight /></a>
    <a href={content.contact.linkedin} target="_blank" rel="noreferrer"><span>03 / LINKEDIN</span><strong>Let’s connect</strong><ArrowUpRight /></a>
    <a href={`tel:${content.contact.phone}`}><span>04 / PHONE</span><strong>+91 63708 06401</strong><ArrowUpRight /></a>
  </div>
}
