# TONY AI · Frontend

AI Autonomous Trading & Automation Operating System — Next.js 16 dashboard for MacLorian X Group.

## Stack

- **Next.js 16** (Turbopack) + React 19 + TypeScript
- **Tailwind v4** + custom cyberpunk tokens
- **NextAuth v5** (Credentials provider, JWT 7d)
- **Chart.js** (sparklines) + **Framer Motion** (page transitions)
- **PWA** (manifest + service worker)

## 17 routes

`/` Panel · `/chat` Chat con Tony · `/company` Empresa · `/social-manager` Posts · `/vault` Bóveda · `/trading` Trading · `/agents` Agentes IA · `/workflows` Flujos n8n · `/email` Gmail · `/news` Noticias · `/research` YouTube RAG · `/matrix` Modo Matrix · `/social` Intel Social · `/security` Seguridad · `/automation` Automatización · `/analytics` Análisis · `/settings` Ajustes · `/login` Auth

## Setup

```bash
npm install
cp .env.local.example .env.local  # editar con tus secretos
npm run dev   # development
npm run build && npm start  # production
```

## Required env vars

| Var | Value |
|---|---|
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `TONY_USERNAME` | tu usuario |
| `TONY_PASSWORD` | tu contraseña fuerte |
| `NEXT_PUBLIC_API_URL` | URL del backend Flask (`http://127.0.0.1:8765` local, Cloudflare Tunnel/ngrok prod) |

## Deploy a Vercel

```bash
npm install -g vercel
vercel login
vercel  # deploy preview
vercel --prod  # deploy a producción
```

Configurar env vars en Vercel dashboard → Settings → Environment Variables.

Custom domain: `vercel domains add tony.maclorianxgroup.com`

## Backend público (zero-cost)

El backend Flask corre local. Para que Vercel pueda alcanzarlo:

### Opción A — Cloudflare Tunnel (recomendado)
```bash
winget install --id Cloudflare.cloudflared
cloudflared tunnel login
cloudflared tunnel create tony-api
cloudflared tunnel route dns tony-api api.maclorianxgroup.com
cloudflared tunnel run tony-api  # apunta a localhost:8765
```
Permanent URL · gratis · DNS de Cloudflare requerido.

### Opción B — ngrok (URL random)
```bash
ngrok http 8765
```
Cada restart cambia URL — actualizar `NEXT_PUBLIC_API_URL` en Vercel.

## Auto-start en Windows

`watchdog.ps1` reinicia automáticamente:
- Flask backend (`tony_dashboard.py:8765`)
- Next.js production server (`npm start` en :3000)
- n8n (5678) · ngrok · Ollama (11434) · file_writer (9091)

Cada 60s checa health, restart si falla.
