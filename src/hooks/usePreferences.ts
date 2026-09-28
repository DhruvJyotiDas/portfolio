import { useCallback, useEffect, useRef, useState } from 'react'

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

export function useAudio() {
  const [enabled, setEnabled] = useState(false)
  const audio = useRef<AudioContext | null>(null)
  const play = useCallback((startup = false) => {
    const ctx = audio.current
    if (!ctx || ctx.state !== 'running') return
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(startup ? 110 : 220, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(startup ? 440 : 90, ctx.currentTime + .35)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(.035, ctx.currentTime + .03)
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .5)
    oscillator.connect(gain).connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + .55)
  }, [])
  const toggle = useCallback(async () => {
    try {
      if (enabled) { await audio.current?.suspend(); setEnabled(false) }
      else {
        audio.current ??= new AudioContext()
        await audio.current.resume()
        setEnabled(true)
        play(true)
      }
    } catch { setEnabled(false) }
  }, [enabled, play])
  useEffect(() => () => { void audio.current?.close(); audio.current = null }, [])
  return { enabled, toggle, play }
}
