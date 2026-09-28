import { createServer } from 'vite'
import { readFile, writeFile, readdir, stat } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import path from 'node:path'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, entries: [], include: [] } })
try {
  const { render } = await server.ssrLoadModule('/src/entry-server.tsx')
  const template = await readFile('dist/index.html', 'utf8')
  let html = template.replace('<!--app-html-->', render())
  if (process.env.VITE_SITE_URL) {
    const site = new URL(process.env.VITE_SITE_URL)
    const base = process.env.VITE_BASE_PATH || '/'
    const canonical = new URL(base, site).href
    html = html.replace('</head>', `<link rel="canonical" href="${canonical}" /></head>`)
    html = html.replace(/(property="og:image" content=")[^"]+/, `$1${new URL(`${base}og-gpu.png`, site).href}`)
  }
  await writeFile('dist/index.html', html)
  let compressed = 0
  async function measure(dir) {
    for (const file of await readdir(dir)) {
      const full = path.join(dir, file)
      if ((await stat(full)).isDirectory()) await measure(full)
      else if (!/\.pdf$/.test(file)) compressed += gzipSync(await readFile(full)).length
    }
  }
  await measure('dist')
  console.log(`Prerendered all sections. Total compressed assets (including GPU still, excluding PDFs): ${(compressed / 1024 / 1024).toFixed(2)} MB`)
  if (compressed > 4 * 1024 * 1024) throw new Error('Compressed asset budget exceeded (4 MB)')
} finally { await server.close() }
