import { useEffect, useRef } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import type { Project } from '../content'

function Readout({ value, reduced }: { value: string; reduced: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (reduced || !/^\+?\d/.test(value)) return
    const match = value.match(/^(\+?)([\d,.]+)(.*)$/)
    if (!match) return
    const number = Number(match[2].replaceAll(',', ''))
    const decimals = match[2].split('.')[1]?.length || 0
    let frame = 0
    const start = performance.now()
    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / 800)
      if (ref.current) ref.current.textContent = `${match[1]}${(number * (1 - (1 - t) ** 3)).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${match[3]}`
      if (t < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [value, reduced])
  return <span ref={ref}>{value}</span>
}

export default function ProjectDialog({ project, onClose, reduced }: { project: Project | null; onClose: () => void; reduced: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const node = dialog.current!
    if (!project) { if (node.open) node.close(); return }
    const trigger = document.activeElement as HTMLElement | null
    node.showModal()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      node.close(); document.body.style.overflow = previous
      if (trigger?.isConnected && trigger !== document.body) trigger.focus({ preventScroll: true })
      else document.getElementById(`project-${project.id}`)?.focus({ preventScroll: true })
    }
  }, [project])
  return <dialog ref={dialog} className="project-dialog" aria-labelledby="project-dialog-title" onCancel={onClose} onKeyDown={event => {
    if (event.key !== 'Tab') return
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button, a[href], [tabindex="0"]'))
    const first = focusable[0], last = focusable.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    {project && <div className="dialog-inner">
      <div className="dialog-top"><span className="eyebrow">MEMORY BANK / {project.category}</span><button className="icon-button" onClick={onClose} aria-label="Close project"><X size={20} /></button></div>
      <h2 id="project-dialog-title">{project.name}<span className="lime">.</span></h2>
      <p className="dialog-subtitle">{project.subtitle}</p>
      <div className="benchmark-grid">{project.metrics.map(metric => <div key={metric.label}><strong><Readout value={metric.value} reduced={reduced} /></strong><span>{metric.label}</span>{/^[+−-]?\d/.test(metric.value) && <div className="benchmark-track"><i style={{ width: `${Math.max(2, metric.fraction * 100)}%` }} /></div>}</div>)}</div>
      <div className="dialog-copy"><div><h3>THE PROBLEM</h3><p>{project.problem}</p></div><div><h3>THE APPROACH</h3><p>{project.approach}</p></div></div>
      {project.highlights && <div className="dialog-highlights"><h3>KEY FEATURES</h3><ul>{project.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul></div>}
      {project.presentation && <div className="dialog-presentation"><div><span>{project.presentation.status}</span><h3>{project.presentation.acronym}</h3><p>{project.presentation.conference}<br />{project.presentation.location}</p></div><a className="button button-secondary" href={`${import.meta.env.BASE_URL}${encodeURIComponent(project.presentation.certificate)}`} target="_blank" rel="noreferrer">View presentation certificate <ArrowUpRight size={16} /></a></div>}
      <div className="tech-tags">{project.stack.map(tech => <span key={tech}>{tech}</span>)}</div>
      <div className="dialog-footer"><span>PROJECT DETAILS FROM THE PROVIDED MATERIALS AND LINKED REPOSITORIES</span>{project.link && <a className="button button-primary" href={project.link.url} target="_blank" rel="noreferrer">{project.link.label}<ArrowUpRight size={16} /></a>}</div>
    </div>}
  </dialog>
}
