# Validation record

Validated September 28, 2026 on Windows, Node.js 24.12.0, and installed Google Chrome against the production build.

## Build and interactions

- Strict TypeScript checking, Vite production build, and semantic HTML pre-rendering pass.
- **17 Playwright checks passed** on the content and hardware update, with three intentional viewport-specific skips. Two subsequent desktop checks passed for reversible scroll-state progression and the inspection views. Desktop raycasting, diagnostics, and inspection are desktop-only checks; the mobile menu check runs on mobile.
- Coverage includes all seven zones, all six project dialogs, a direct 3D memory-chip click, automatic boot completion, six simulated telemetry readings, world-anchored fan inspection, keyboard focus trapping/restoration, both CV PDFs and the Samsung PRISM PDF, resume download, contact destinations, reduced motion, unavailable/lost WebGL, no-JavaScript content, and mobile navigation/resizing.
- The original portfolio content, supplied CVs, navigation, typography, and section layout are preserved. The hardware now has curved fan geometry, a layered shroud, detailed cooling assembly, distinct procedural materials, PCB components, and diagnostic leaders.

## Visual review

All seven camera zones were captured and reviewed at 1920×1080, 1440×900, 1366×768, 1024×1366, and 390×844. Additional captures cover the exploded transition, reverse-scroll reassembly, all four inspection views, and mobile hardware framing. Tablet framing stays clear of the biography. The canvas edges fade into the existing background; content remains readable on small screens.

The review script records runtime errors, horizontal overflow, quality tier, frame intervals, draw calls, and triangle counts in `artifacts/upgrade/review.json`. Screenshots are in the same directory.

## Performance and limitations

Rendering begins conservatively and adapts to measured frame timing. Mobile uses the low tier; desktop can promote to high, then falls back if it cannot sustain the target. The low tier keeps the actual curved fan blades and hardware silhouette, reduces segments/fins, and removes post-processing. Circuit traces share one geometry; repeated components are instanced. Fading materials compile their transparent variants during initialization to reduce first-scroll shader stalls.

Measurements are local headless-Chrome RAF intervals on Intel Iris Xe through ANGLE/Direct3D11. They are not GPU timer queries or guarantees across devices. Shader compilation, quality changes, background load, and viewport size can affect individual frames. Physical iOS/Android devices, Safari, and Firefox have not been tested; mobile coverage uses Chromium emulation.

The new build is **0.93 MB gzip** across all generated assets except downloadable PDFs, including local fonts and the actual-scene social/fallback image, below the enforced 4 MB budget.

| Viewport | Seven-zone mean interval range |
| --- | --- |
| 1920×1080 | 16.43–16.60 ms |
| 1440×900 | 16.43–16.60 ms |
| 1366×768 | 16.41–16.58 ms |
| 1024×1366 | 16.41–16.58 ms |
| 390×844 | 16.36–16.59 ms |

These are 60-frame requestAnimationFrame samples after each zone change in headless Chrome on Intel Iris Xe. The renderer starts in the low tier on this integrated GPU, avoiding the multi-second quality-switch stalls seen before that startup selection was added. All 35 zone samples reported zero browser console errors and zero horizontal overflow. The intervals are near the 60 fps target under these conditions, but they do not establish sustained GPU frame time on other hardware or browsers.

The refreshed 1200×630 social capture, rendered from the real procedural scene, measured **16.59 ms mean** and **16.80 ms p95** over 180 requestAnimationFrame intervals on the low tier.

## Reproduce

```sh
npm run build
npm run test:e2e
npm start
```

With localhost preview running, use a second terminal:

```sh
node scripts/review-gpu.mjs
npm run capture:og
npm run build
```

The social capture writes `public/og-gpu.png` at 1200×630 and samples 180 frames into `artifacts/performance.json`. The final build copies that still to `dist`. Browser artifacts and Playwright reports are generated files.

The production site is served at **http://127.0.0.1:4173/**. Use `npm start` to restart it after stopping the server or rebooting. Public deployment is not included; configure `VITE_BASE_PATH` and `VITE_SITE_URL` as documented in the README when choosing a static host. Portfolio claims follow the supplied CVs and linked repository descriptions; live external services were not independently audited.
