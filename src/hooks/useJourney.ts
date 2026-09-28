import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { zones } from '../content'

export interface JourneyState { progress: number; zone: number; transition: number }
export function useJourney(reduced: boolean) {
  const journey = useRef<JourneyState>({ progress: 0, zone: 0, transition: 0 })
  const [activeZone, setActiveZone] = useState(0)
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const sections = zones.map(zone => document.getElementById(zone.id)!)
    const state = { travel: 0 }
    const timeline = gsap.timeline({ paused: true })
    zones.slice(1).forEach((_, index) => timeline.to(state, { travel: index + 1, duration: 1, ease: 'sine.inOut' }))
    const trigger = ScrollTrigger.create({
      start: 0,
      end: () => document.documentElement.scrollHeight - innerHeight,
      onUpdate: self => {
        const y = self.scroll()
        let segment = 0
        for (let i = 0; i < sections.length; i++) if (y + innerHeight * .3 >= sections[i].offsetTop) segment = i
        const start = Math.max(0, sections[segment].offsetTop - innerHeight * .3)
        const next = sections[segment + 1]
        const end = next ? next.offsetTop - innerHeight * .3 : document.documentElement.scrollHeight - innerHeight
        const local = Math.max(0, Math.min(1, (y - start) / Math.max(1, end - start)))
        timeline.time(segment + (next ? local : 0))
        const previous = journey.current.zone
        journey.current.progress = reduced ? segment : state.travel
        journey.current.zone = segment
        if (previous !== segment) journey.current.transition = reduced ? 0 : 1
        setActiveZone(segment)
        setProgress(Math.round(self.progress * 100))
      },
    })
    ScrollTrigger.refresh()
    const refresh = () => ScrollTrigger.refresh()
    document.fonts.ready.then(refresh)
    return () => { trigger.kill(); timeline.kill() }
  }, [reduced])
  return { journey, activeZone, progress }
}
