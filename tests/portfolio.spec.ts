import { expect, test } from '@playwright/test'

test('renders the GPU, navigates all zones, and opens every project', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('.app')).toHaveAttribute('data-scene-ready', 'true', { timeout: 30000 })
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.locator('.app')).not.toHaveClass(/static-mode/)
  const boot = page.getByRole('button', { name: 'PRESS / SCROLL TO POWER ON' })
  if (await boot.isVisible()) await boot.click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Intelligence.Engineered.')
  await page.screenshot({ path: `artifacts/${testInfo.project.name}-hero.png` })
  for (const [index, id] of ['overview', 'about', 'experience', 'projects', 'skills', 'certifications', 'contact'].entries()) {
    await page.locator(`#${id}`).evaluate(element => element.scrollIntoView({ behavior: 'instant', block: 'start' }))
    await expect(page.locator('.zone-indicator')).toContainText(`ZONE 0${index + 1}`)
    await page.waitForTimeout(700)
    await page.screenshot({ path: `artifacts/${testInfo.project.name}-${id}.png` })
  }
  await expect(page.locator('.project-list button').first()).toHaveAttribute('aria-label', 'Explore Chat X')
  await expect(page.locator('.project-list button').nth(2)).toHaveAttribute('aria-label', 'Explore Compass')
  for (const name of ['Chat X', 'CET-ViT', 'Compass', 'XAlign', 'Med-X', 'TLS-Mimicking Proxy']) {
    const button = page.getByRole('button', { name: `Explore ${name}`, exact: true })
    await button.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { level: 2 })).toContainText(name)
    await expect(dialog.getByText('THE APPROACH')).toBeVisible()
    if (name === 'XAlign') await expect(dialog.getByRole('link')).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(button).toBeFocused()
  }
  expect(errors).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
})

test('dialog keeps keyboard focus inside and restores the trigger', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Explore CET-ViT', exact: true }).click()
  const close = page.getByRole('button', { name: 'Close project' })
  await expect(close).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('link', { name: 'Explore model', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()
  await close.click()
  await expect(page.getByRole('button', { name: 'Explore CET-ViT', exact: true })).toBeFocused()
})

test('a memory chip opens its project directly from the 3D canvas', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop raycast coordinates; mobile uses equivalent touch cards')
  await page.goto('/')
  await expect(page.locator('.app')).toHaveAttribute('data-scene-ready', 'true', { timeout: 30000 })
  await page.locator('#projects').evaluate(element => element.scrollIntoView({ behavior: 'instant' }))
  await expect(page.locator('.zone-indicator')).toContainText('ZONE 04')
  // Target the projected world-space anchor, so camera refinements don't break this test.
  await page.waitForTimeout(1800)
  const anchor = page.locator('.gpu-annotations [data-component="memory"] .annotation-anchor')
  const bounds = await anchor.boundingBox()
  expect(bounds).not.toBeNull()
  await page.mouse.move(bounds!.x + 2, bounds!.y + 2)
  await expect(page.locator('.scene-canvas > div')).toHaveCSS('cursor', 'pointer')
  const updated = await anchor.boundingBox()
  await page.mouse.click(updated!.x + 2, updated!.y + 2)
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.locator('#project-dialog-title')).toContainText('CET-ViT')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Explore CET-ViT', exact: true })).toBeFocused()
})

test('serves resumes and real contact destinations', async ({ page, request }) => {
  await page.goto('/')
  for (const name of ['DhruvJyotiDas_CV.pdf', 'DhruvJyotiDas_Research_CV.pdf', 'SAMSUNG PRISM.pdf']) {
    const response = await request.get(`/${name}`)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('application/pdf')
    expect((await response.body()).subarray(0, 4).toString()).toBe('%PDF')
  }
  await expect(page.locator('a[href="mailto:dd4708@srmist.edu.in"]')).toHaveCount(1)
  await expect(page.locator('a[href="tel:+916370806401"]')).toHaveCount(1)
  await expect(page.getByText('Saeed Hamood Alsamhi')).toBeVisible()
  await page.locator('.role-resources summary').click()
  await expect(page.getByRole('link', { name: 'Samsung PRISM research PDF' })).toHaveAttribute('href', '/SAMSUNG%20PRISM.pdf')
  await expect(page.getByRole('link', { name: 'KG-CoQA dataset' })).toHaveAttribute('href', 'https://huggingface.co/datasets/vikash0132/KG-CoQA')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Resume', exact: true }).click()
  expect((await downloadPromise).suggestedFilename()).toBe('DhruvJyotiDas_CV.pdf')
})

test('shows verified credentials, recommendation letters, and the CET-ViT presentation certificate', async ({ page, request }) => {
  await page.goto('/')
  const documents = [
    ['View Java SE 11 Developer certificate', 'ORACLE_JAVA_SE_11_eCertificate.pdf'],
    ['View OCI Data Science certificate', 'CERTIFICATE - Oracle Cloud Infrastructure 2025 Certified Data Science Professional Certificate.pdf'],
    ['View Certified Application Developer certificate', 'CAD ServiceNow Certificate.pdf'],
    ['Dr. Shibu N V Samsung PRISM project mentor View letter', 'LOR-Shibu-sir.pdf'],
    ['Dr. Arulmurugan A Faculty advisor View letter', 'LOR-arulmurgan-sir.pdf'],
  ] as const
  for (const [label, filename] of documents) {
    const url = `/${encodeURIComponent(filename)}`
    await expect(page.getByRole('link', { name: label })).toHaveAttribute('href', url)
    const response = await request.get(url)
    expect(response.status()).toBe(200)
    expect((await response.body()).subarray(0, 4).toString()).toBe('%PDF')
  }
  await page.getByRole('button', { name: 'Explore CET-ViT' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('ICSL-DSGA 2026')).toBeVisible()
  await expect(dialog.getByText('Sunway University, Malaysia')).toBeVisible()
  const certificate = dialog.getByRole('link', { name: 'View presentation certificate' })
  const certificateUrl = '/Dhruv%20Jyoti%20Das-1.pdf'
  await expect(certificate).toHaveAttribute('href', certificateUrl)
  const response = await request.get(certificateUrl)
  expect(response.status()).toBe(200)
  expect((await response.body()).subarray(0, 4).toString()).toBe('%PDF')
})

test('research order, portrait, expanded skills, and theme control are available', async ({ page, request }, testInfo) => {
  await page.goto('/')
  await expect(page.locator('#experience .experience-list article')).toHaveCount(4)
  await expect(page.locator('#experience .experience-list article').nth(2)).toContainText('Saeed Hamood Alsamhi')
  await expect(page.locator('#experience .experience-list article').nth(2)).toContainText('NUIG, Galway, Ireland')
  await expect(page.locator('#experience .experience-list article').nth(3)).toContainText('SRM UROP')
  await expect(page.locator('.hero-bottom')).toHaveCount(0)
  await expect(page.locator('#skills')).toContainText('Tableau')
  await expect(page.locator('#skills')).toContainText('Matplotlib')
  const portrait = page.locator('.about-portrait img')
  await expect(portrait).toHaveAttribute('alt', 'Dhruv reading a comic at a bookstore')
  await expect(portrait).toHaveJSProperty('complete', true)
  expect((await request.get('/Dhruv_Comic_Image.jpg')).status()).toBe(200)
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await expect(page.locator('.app')).toHaveAttribute('data-theme', 'light')
  await page.screenshot({ path: `artifacts/${testInfo.project.name}-light-theme-hero.png` })
  await page.reload()
  await expect(page.locator('.app')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await expect(page.locator('.app')).toHaveAttribute('data-theme', 'dark')
})

test('thermal sensors, coolant selector, and IR view follow the GPU scene', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.locator('.app')).toHaveAttribute('data-scene-ready', 'true', { timeout: 30000 })
  const boot = page.getByRole('button', { name: 'PRESS / SCROLL TO POWER ON' })
  if (await boot.isVisible()) await boot.click()
  await expect(page.locator('.diagnostic-readings > div')).toHaveCount(6)
  await expect(page.locator('.diagnostic-panel')).toContainText('COOLANT')
  await expect(page.locator('.diagnostic-panel')).toContainText('PUMP')
  await page.getByRole('button', { name: 'Coolant color: cyan. Change color' }).click()
  await expect(page.getByRole('button', { name: 'Coolant color: green. Change color' })).toBeVisible()
  await page.getByRole('button', { name: 'thermal inspection view' }).click()
  await expect(page.locator('.app')).toHaveAttribute('data-inspection-mode', 'thermal')
  await expect(page.locator('.gpu-annotations [data-component="coldplate"]')).toHaveCount(1)
  if (testInfo.project.name === 'desktop') await page.screenshot({ path: 'artifacts/thermal-ir-desktop.png' })
})

test('diagnostics initialize and fan inspection is anchored to the hardware', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Detailed diagnostic panel is desktop-only')
  const errors: string[] = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect(page.locator('.diagnostic-panel')).toHaveAttribute('data-online', 'true', { timeout: 30000 })
  await expect(page.locator('.diagnostic-readings > div')).toHaveCount(6)
  await expect(page.locator('.boot-terminal')).toHaveCount(0)
  const anchor = page.locator('.gpu-annotations [data-component="fan"] .annotation-anchor')
  const bounds = await anchor.boundingBox()
  expect(bounds).not.toBeNull()
  await page.mouse.move(bounds!.x + 2, bounds!.y + 2)
  await expect(page.locator('.inspect-hint')).toContainText('FAN ARRAY / RPM FOLLOWS LOAD')
  await page.mouse.move(40, 40)
  await expect(page.locator('.inspect-hint')).toContainText('INSPECT HARDWARE')
  await page.waitForTimeout(1500)
  expect(errors).toEqual([])
})

test('scroll power sequence advances and reverses with the hardware readout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Detailed hardware readout is desktop-only')
  await page.goto('/')
  await expect(page.locator('.app')).toHaveAttribute('data-scene-ready', 'true', { timeout: 30000 })
  await expect(page.locator('.power-log')).toContainText('STANDBY')
  await expect(page.locator('.power-log')).toContainText('FAN 0 RPM')
  await page.locator('#experience').evaluate(element => element.scrollIntoView({ behavior: 'instant' }))
  await expect(page.locator('.power-log')).toContainText('POWER DELIVERY')
  await page.locator('#projects').evaluate(element => element.scrollIntoView({ behavior: 'instant' }))
  await expect(page.locator('.power-log')).toContainText('MEMORY TRAINING')
  await page.locator('#skills').evaluate(element => element.scrollIntoView({ behavior: 'instant' }))
  await expect(page.locator('.power-log')).toContainText('COMPUTE / THERMAL')
  await page.locator('#overview').evaluate(element => element.scrollIntoView({ behavior: 'instant' }))
  await expect(page.locator('.power-log')).toContainText('STANDBY')
  await expect(page.locator('.power-log')).toContainText('VCORE 0.00V')
})

test('inspection views switch without breaking the project controls', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Inspection controls are desktop-only')
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect(page.locator('.app')).toHaveAttribute('data-scene-ready', 'true', { timeout: 30000 })
  for (const mode of ['xray', 'signal', 'thermal', 'exterior']) {
    await page.getByRole('button', { name: `${mode} inspection view` }).click()
    await expect(page.locator('.app')).toHaveAttribute('data-inspection-mode', mode)
    await expect(page.getByRole('button', { name: `${mode} inspection view` })).toHaveAttribute('aria-pressed', 'true')
  }
  await page.locator('#projects').evaluate(element => element.scrollIntoView({ behavior: 'instant' }))
  await page.getByRole('button', { name: 'Explore Compass', exact: true }).hover()
  await expect(page.locator('.power-log')).toContainText('WORKLOAD COMPASS')
  await page.getByRole('button', { name: 'Explore Compass', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('AI Segment Builder')
  expect(errors).toEqual([])
})

test('reduced motion preserves content and ordinary navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.app')).toHaveClass(/static-mode/)
  await expect(page.locator('.boot-terminal')).toHaveCount(0)
  await page.locator('#contact').evaluate(element => element.scrollIntoView())
  await expect(page.getByRole('heading', { name: 'Plug in. Let’s build.' })).toBeVisible()
  await expect(page.locator('.zone-indicator')).toContainText('ZONE 07')
})

test('WebGL failure keeps a usable portfolio', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2') return null
      return original.apply(this, [type, ...args] as Parameters<typeof original>)
    } as typeof original
  })
  await page.goto('/')
  await expect(page.locator('.app')).toHaveClass(/static-mode/)
  await expect(page.locator('.boot-terminal')).toHaveCount(0)
  await page.getByRole('button', { name: 'Explore XAlign', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('production HTML exposes all content without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(baseURL!)
  await expect(page.locator('main > section')).toHaveCount(7)
  await expect(page.getByRole('heading', { name: 'Samsung R&D' })).toBeVisible()
  const details = page.locator('.static-project-detail').first()
  await details.locator('summary').click()
  await expect(details.getByText(/Bring dependable messaging/)).toBeVisible()
  const cetDetails = page.locator('.flagship-project .static-project-detail')
  await expect(cetDetails).toContainText('Accepted and presented')
  await expect(cetDetails.locator('a', { hasText: 'View presentation certificate' })).toHaveAttribute('href', '/Dhruv%20Jyoti%20Das-1.pdf')
  await expect(page.getByRole('link', { name: 'View Java SE 11 Developer certificate' })).toHaveAttribute('href', '/ORACLE_JAVA_SE_11_eCertificate.pdf')
  await expect(page.getByRole('link', { name: /Dr. Shibu N V/ })).toHaveAttribute('href', '/LOR-Shibu-sir.pdf')
  await expect(page.getByRole('link', { name: 'Resume', exact: true })).toHaveAttribute('download', '')
  await context.close()
})

test('lost WebGL context switches to static content', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.app')).toHaveAttribute('data-scene-ready', 'true', { timeout: 30000 })
  await page.locator('canvas').evaluate(canvas => {
    const context = (canvas as HTMLCanvasElement).getContext('webgl2')
    context?.getExtension('WEBGL_lose_context')?.loseContext()
  })
  await expect(page.locator('.app')).toHaveClass(/static-mode/)
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Resume', exact: true })).toBeVisible()
})

test('mobile menu and resize remain usable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile navigation scenario')
  await page.goto('/')
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Projects' }).click()
  await expect(page.getByRole('button', { name: 'Open navigation' })).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('.zone-indicator')).toContainText('ZONE 04')
  await page.setViewportSize({ width: 844, height: 390 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
})
