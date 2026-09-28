# THE GPU — Dhruv Jyoti Das

A scroll-driven portfolio built around a procedural, animated graphics card. React + TypeScript + Vite, React Three Fiber / Three.js, GSAP ScrollTrigger, Tailwind CSS, and custom GLSL. No backend, external font requests, downloaded 3D models, or API keys.

## Run locally

Requires Node.js 22.12+ (validated with Node 24) and npm.

```sh
npm install
npm run dev
```

Open the URL printed by Vite. The boot widget reports initialization milestones; Enter, the power-on button, scrolling, or normal navigation dismisses it. The site remains usable while the 3D engine loads. Sound starts muted.

To serve the finished production build on localhost, run `npm start` and open **http://127.0.0.1:4173/**. Run `npm run build` first after changing source files. The server stays local to this computer; restart it with `npm start` after a reboot.

```sh
npm run build
npm run preview -- --port 4173
```

The build type-checks the project, creates a production bundle, pre-renders all seven sections and project details into `dist/index.html`, and enforces a 4 MB compressed asset budget. Pre-rendering is a build step; the deployed site needs only static hosting. The development server uses client rendering; use production preview to verify no-JavaScript behavior.

## Update content

- Edit `src/content.ts` for biography, education, research experience, projects, metrics, skill groups, certifications, contact addresses, and resume filenames. `ProjectId` and `ZoneId` connect HTML content to scene interactions.
- Replace the matching files in `public/` to update either downloadable CV. Both supplied PDFs are preserved there.
- Update the editorial headings in `src/sections/Sections.tsx` and page metadata in `index.html` when changing the portfolio’s identity or visual story.
- Keep numeric metrics tied to the underlying evaluation. The UI presents CV-reported results, not independently verified benchmarks. GPU telemetry is explicitly simulated.

Content combines the supplied general and research CVs with the later project and collaborator updates. IIT Indore uses **November 2025–Present**; SRM UROP uses **August 2025–Present**. The research section has four entries: Samsung, IIT Indore, ongoing work with Saeed Hamood Alsamhi at NUIG in Galway, and SRM UROP. The collaboration entry intentionally omits a research topic and start date because those were not supplied. Six projects are featured: Chat X first, CET-ViT second and still the flagship, Compass third, then XAlign, Med-X and the TLS proxy. Chat X, Compass and Med-X link to their supplied GitHub repositories; CET-ViT links to its Hugging Face model; the proxy links to its repository. XAlign has no invented destination. The Samsung R&D card expands to show the local PRISM PDF and KG-CoQA dataset. Med-X summarizes its linked project description but omits the repository’s "encoder-only MedGemma" claim because [Google documents MedGemma as decoder-only](https://developers.google.com/health-ai-developer-foundations/medgemma/model-card).

The About section displays `public/Dhruv_Comic_Image.jpg`. The header offers persistent dark and light modes through local storage. The skills list includes CV-supported web, visualization, AI, and research tools. GPU callouts identify the cooling array, thermal assembly, core, memory, PCB, power stages, contacts, and display outputs; the I/O bracket marks three DisplayPort openings and one HDMI opening.

The Credentials section links the supplied Oracle Java SE 11, Oracle OCI Data Science Professional, and ServiceNow CAD certificates, plus recommendation letters from Dr. Shibu N V and Dr. Arulmurugan A. CET-ViT's project dialog links its presentation certificate for ICSL-DSGA 2026 at Sunway University, Malaysia. [Sunway University describes the event as IEEE technically co-sponsored](https://www.sunwayuniversity.edu.my/news/2026/sunway-university-organises-inaugural-1st-international-conference-on-statistical); its published conference information says accepted and presented papers are submitted for IEEE Xplore consideration, subject to review. The site does not claim confirmed Scopus indexing.

## Scene and interaction

| Location | Responsibility |
| --- | --- |
| `src/scene/` | Procedural GPU geometry, studio environment, custom shaders, camera stops, adaptive quality |
| `src/sections/` | Semantic content and accessible native project dialog |
| `src/hud/` | Navigation, telemetry, progress, boot widget, audio control |
| `src/hooks/` | Scroll-to-camera mapping, motion preference, synthesized audio |

The scene contains a triple-fan shroud, instanced fins and connector pins, copper pipes, PCB, iridescent die, VRM stages, six project chips, and a labeled backplate. Camera stops live in `src/scene/config.ts`; the GSAP timeline in `useJourney.ts` maps actual section positions to those stops. Camera travel follows an arc around the card to avoid flying through it during the backplate transition. `src/scene/hardware/state.ts` maps scroll position to the electrical reveal: power delivery, VRM startup, core activation, memory training, compute, and connection. It drives conductive trace packets, an abstract [Blackwell-inspired](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/) silicon floorplan, and staged indicators. The die artwork is a visualization, not a reproduction of a proprietary NVIDIA floorplan.

`src/scene/thermal/simulation.ts` is the single simulated source for heat load, GPU and coolant temperatures, fan and pump speeds, priming, scroll surges, hover pulses, and one-time throttling. It integrates once per frame in `ThermalController`, while the HUD samples the same state at 120 ms intervals. Base load is 22%; scrolling, project-zone activity, hovers, and zone transitions add heat. The 3-second GPU lag, stepwise 800–3200 RPM fan curve, and 1800–4500 RPM pump curve are illustrative, not engineering measurements. The custom loop carries coolant from the cold plate to the radiator, then through reservoir and pump back to the block. Tube flow shaders, pooled bubbles, radiator fans, airflow, heat-pipe pulses, backplate bloom, IR labels, and telemetry all read that shared state. Low quality uses fewer fins, bubbles, and airflow particles, with no transmission or heat-haze plane. The mini IR map and haze are stylized visualizations rather than calibrated thermal imaging or CFD.

Hover or focus on experience cards and skill groups highlights the associated hardware. Project cards and 3D chips open the same dialog. Keyboard focus loops within the dialog, Escape closes it, and focus returns to the trigger. The four connector-pin groups open the same destinations as the HTML contact links in the final zone.

Three quality profiles are implemented in `Scene.tsx`: mobile and recognized integrated/software renderers start low; other desktops start medium, and measured frame timing can reduce quality. Sustained high performance on a larger display with sufficient CPU concurrency can enable high quality. Low retains curved fan geometry with fewer segments, fewer fins and particles, DPR 1, and no post-processing. Medium caps DPR at 1.25 with restrained bloom, vignette, SMAA, and brief chromatic transitions. High caps DPR at 1.5 and adds ambient occlusion. A rejected high tier is not repeatedly retried. There are three directional lights and a procedurally captured studio reflection environment. No textures exceed 1K.

The detailed hardware modules live in `src/scene/hardware/`: pitched fan blades, recessed shroud, chamfered metal frame, heatpipes, vented I/O bracket, PCB components, notched gold contacts, and engraved backplate. Separate metal, polymer, silicon, ceramic, and PCB materials use small procedural surface maps. Repeated fins, blades, screws, and components are instanced; circuit paths share one draw call. The exterior separates briefly during the architecture transition, then fades to reveal the board.

After real initialization, the hardware settles through a roughly 2.1-second startup and the terminal dismisses automatically. Mouse parallax is damped and bounded to three degrees vertically and five horizontally, resetting when the pointer leaves. World-anchored diagnostic leaders adapt to screen width. The six telemetry readings, activity indicators, and sparklines are explicitly simulated and update gently. All important actions remain available through HTML controls.

The HUD offers Exterior, Xray, Signal, and IR View inspection buttons on desktop, with IR View and coolant color selection retained on mobile. IR View fades the shroud and maps cool components to blue/cyan and warmer components toward yellow, with live temperature callouts and a scanline transition. The coolant selector cycles cyan, green, and orange. These views never replace the HTML project cards or section navigation. The unified thermal-load gauge and sensor panel remain explicitly simulated.

Reduced motion disables the scroll flight, idle motion, audio transitions, and count-up effects; the GPU renders on demand. WebGL initialization failure, context loss, or a 20-second initialization timeout switches to a still backdrop with fully usable HTML content. Tabs hidden in the background stop continuous rendering. No-JavaScript visitors receive pre-rendered sections and expandable project details.

## Validation and assets

```sh
npm run typecheck
npm run build
npm run test:e2e
```

With production preview running, `node scripts/review-gpu.mjs` captures all seven zones at 1920×1080, 1440×900, 1366×768, 1024×1366, and 390×844. It records console errors, overflow, frame intervals, quality tier, draw calls, and triangle counts in `artifacts/upgrade/review.json`.

Browser tests use installed Google Chrome through Playwright. They start production preview automatically if needed. If Chrome is unavailable, install Playwright Chromium (`npx playwright install chromium`) and remove `channel: 'chrome'` from `playwright.config.ts` and the capture script. Tests cover desktop/mobile rendering, zone navigation, all project dialogs, keyboard focus, resume downloads, contact destinations, reduced motion, unavailable/lost WebGL, no-JavaScript content, mobile navigation, and resizing. Screenshots and test traces are local artifacts, excluded from source control.

Generate the social image from the actual procedural GPU while production preview is running:

```sh
npm run capture:og
npm run build
```

This writes `public/og-gpu.png` and `artifacts/performance.json`. Rebuilding copies the new still into `dist`. The capture includes a 180-frame RAF sample with browser renderer and quality information; this is a local diagnostic, not a cross-device performance guarantee. See `VALIDATION.md` for the measured results and limits.

## Static hosting

Deploy the **contents of `dist/`** to any static host. No route rewrites are necessary: navigation uses section anchors. This project has not been deployed.

For a subdirectory such as GitHub Pages `/Portfolio_web/`, set `VITE_BASE_PATH=/Portfolio_web/` before building. For absolute canonical and social-image metadata, also set `VITE_SITE_URL` to the deployment origin. Example in PowerShell:

```powershell
$env:VITE_BASE_PATH = '/Portfolio_web/'
$env:VITE_SITE_URL = 'https://dhruvjyotidas.github.io'
npm run build
```

For root hosting, use `/` as the base. The runtime has no analytics or monitoring service; use the browser console and the checked-in tests for diagnostics. Enable gzip or Brotli compression on the host. Resume PDFs and the OG image are separate resources; PDFs load only when requested.
