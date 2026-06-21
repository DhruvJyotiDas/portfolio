# Dhruv Jyoti Das — Portfolio

Next.js 14 (App Router) · React 18 · TypeScript · Three.js / React-Three-Fiber · Framer Motion · Tailwind.
A research-instrument portfolio: a shader-driven point field that morphs formation per section, a rich
project overview (metrics, charts, resource links), an experience timeline with logo slots, a terminal,
and an AI assistant grounded in the CV (served safely from a server route).

## Quick start (local)

```bash
npm install
cp .env.example .env        # add your ANTHROPIC_API_KEY
npm run dev                 # http://localhost:3000
```

The 3D field and assistant both work in dev. The assistant calls `POST /api/ask`, which talks to the
Anthropic API **server-side** — the key never reaches the browser.

## Where to edit content

| What | File |
|---|---|
| Experience (Meet.space, Galway, IIT Indore, Samsung) | `src/data/experience.ts` |
| Education badges (IIT Madras, SRMIST) | `src/data/experience.ts` (`education`) |
| Projects (summaries, metrics, charts, links) | `src/data/projects.ts` |
| Assistant knowledge / system prompt | `src/data/profile.ts` |
| Real logos | drop SVGs into `public/logos/` (see its README) |

**TODO markers** in `experience.ts` and `projects.ts` flag fields to confirm (dates, Meet.space scope,
Galway supervisor spelling) and the placeholder `#` links to replace with real paper/code/live URLs.

## Production build

```bash
npm run build      # outputs a standalone server at .next/standalone/server.js
```

> Build fetches the Google fonts via `next/font` at build time, so the build machine needs outbound
> network. If you must build fully offline, swap `next/font/google` in `src/app/layout.tsx` for a
> self-hosted font or a `<link>`.

## Deploy on an Ubuntu VM

### Option A — PM2 (no Docker)

```bash
# 1. Node 20 + PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm i -g pm2

# 2. Build
git clone <your-repo> dhruv-portfolio && cd dhruv-portfolio
npm ci
npm run build

# 3. Standalone needs static + public next to server.js
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# 4. Run with PM2 (key from the shell env)
export ANTHROPIC_API_KEY=sk-ant-xxxx
pm2 start .next/standalone/server.js --name dhruv-portfolio
pm2 save && pm2 startup     # run the printed command to persist across reboots
```

### Option B — Docker

```bash
docker build -t dhruv-portfolio .
docker run -d --name portfolio -p 3000:3000 \
  -e ANTHROPIC_API_KEY=sk-ant-xxxx --restart unless-stopped dhruv-portfolio
```

### Nginx + SSL (both options)

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/dhruv-portfolio
# edit server_name to your domain
sudo ln -s /etc/nginx/sites-available/dhruv-portfolio /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL via Certbot (auto-edits the nginx config + sets up renewal)
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Notes / honest caveats

- **Not build-verified in CI here.** Run `npm run build` once on your machine; fix any font/network
  issues per the note above. Typecheck with `npx tsc --noEmit`.
- **Versions are pinned to Next 14 / React 18 / R3F v8** for stability. To move to Next 15 / React 19
  you must also bump `@react-three/fiber` to v9 and retest the field.
- **Performance:** the field is ~2000 shader points, DPR-capped at 1.5×, halved on mobile, and frozen
  under `prefers-reduced-motion`. The per-frame morph mutates a position buffer on the CPU — fine at
  this scale. If you ever push past ~15k points, move the morph to the GPU (FBO / transform feedback).
- **Lighthouse:** keep the hero text server-rendered (it is) and the Canvas behind it (it is) so LCP is
  text, not WebGL.
