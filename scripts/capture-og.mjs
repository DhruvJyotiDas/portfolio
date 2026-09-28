import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-webgl', '--enable-unsafe-swiftshader'] })
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
  await page.goto('http://127.0.0.1:4173/?capture=1')
  await page.locator('.app[data-scene-ready="true"]').waitFor({ timeout: 30000 })
  if (await page.locator('.app.static-mode').count()) throw new Error('Cannot capture GPU: WebGL unavailable')
  await page.addStyleTag({ content: '.scene-canvas { inset: 0 !important; width: 100% !important; height: 100% !important; mask-image: none !important; } .site-header, main, .bottom-hud, .zone-rail, .zone-indicator, .hero-telemetry, .boot-terminal, .static-gpu, .gpu-annotations { visibility: hidden !important; }' })
  await page.waitForTimeout(6500)
  await page.screenshot({ path: 'public/og-gpu.png' })
  const sample = await page.evaluate(async () => {
    const deltas = []
    let last = performance.now()
    await new Promise(resolve => {
      function frame(now) {
        deltas.push(now - last); last = now
        if (deltas.length >= 180) resolve()
        else requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    })
    const canvas = document.querySelector('canvas')
    const gl = canvas?.getContext('webgl2')
    const extension = gl?.getExtension('WEBGL_debug_renderer_info')
    return {
      meanFrameMs: deltas.reduce((sum, n) => sum + n, 0) / deltas.length,
      p95FrameMs: [...deltas].sort((a, b) => a - b)[Math.floor(deltas.length * .95)],
      renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : 'unknown',
      quality: document.querySelector('.app')?.dataset.quality,
      note: 'Headless browser RAF timing, not a claim of representative laptop GPU performance.',
    }
  })
  await mkdir('artifacts', { recursive: true })
  await writeFile('artifacts/performance.json', JSON.stringify(sample, null, 2))
  console.log(JSON.stringify(sample, null, 2))
  console.log('Saved public/og-gpu.png from the live procedural scene.')
} finally { await browser.close() }
