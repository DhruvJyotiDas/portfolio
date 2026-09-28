import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-webgl', '--enable-unsafe-swiftshader'] })
const sizes = process.argv.includes('--quick') ? [[1440, 900]] : [[1920, 1080], [1440, 900], [1366, 768], [1024, 1366], [390, 844]]
const zones = ['overview', 'about', 'experience', 'projects', 'skills', 'certifications', 'contact']
const reports = []
await mkdir('artifacts/upgrade', { recursive: true })
try {
  for (const [width, height] of sizes) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    await page.goto('http://127.0.0.1:4173/?inspect=1')
    await page.locator('.app[data-scene-ready="true"]').waitFor({ timeout: 30000 })
    if (await page.locator('.app.static-mode').count()) throw new Error(`WebGL fallback at ${width}x${height}: ${errors.join('; ')}`)
    await page.waitForTimeout(6500)
    const report = { width, height, zones: [], errors }
    for (const id of zones) {
      if (id !== 'overview') await page.locator(`#${id}`).evaluate(element => element.scrollIntoView({ behavior: 'instant' }))
      await page.waitForTimeout(1100)
      await page.screenshot({ path: `artifacts/upgrade/${width}-${id}.png` })
      const stats = await page.evaluate(async () => {
        const deltas = []; let last = performance.now()
        await new Promise(resolve => { const next = now => { deltas.push(now - last); last = now; if (deltas.length === 60) resolve(); else requestAnimationFrame(next) }; requestAnimationFrame(next) })
        return { meanFrameMs: deltas.reduce((sum, n) => sum + n, 0) / deltas.length, p95FrameMs: deltas.sort((a,b) => a-b)[57], quality: document.querySelector('.app').dataset.quality, horizontalOverflow: document.documentElement.scrollWidth > innerWidth, drawCalls: document.querySelector('canvas').dataset.drawCalls, triangles: document.querySelector('canvas').dataset.triangles }
      })
      report.zones.push({ id, ...stats })
      if (stats.horizontalOverflow) throw new Error(`Horizontal overflow: ${width}/${id}`)
    }
    if (width < 500) {
      await page.evaluate(() => window.scrollTo({ top: 330, behavior: 'instant' }))
      await page.waitForTimeout(600)
      await page.screenshot({ path: `artifacts/upgrade/${width}-hardware.png` })
    }
    if (width === 1440) {
      await page.evaluate(() => window.scrollTo({ top: (document.getElementById('about').offsetTop - innerHeight * .3) * .53, behavior: 'instant' }))
      await page.waitForTimeout(1800)
      await page.screenshot({ path: 'artifacts/upgrade/exploded.png' })
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await page.waitForTimeout(1800)
      await page.screenshot({ path: 'artifacts/upgrade/reassembled.png' })
    }
    reports.push(report)
    console.log(JSON.stringify(report))
    await page.close()
  }
  await writeFile('artifacts/upgrade/review.json', JSON.stringify(reports, null, 2))
} finally { await browser.close() }
