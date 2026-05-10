# GitHub Actions Workflows

Tony AI auto-deploy + CI configuration.

## Setup (una sola vez)

### 1. Crear Vercel project
```bash
cd tony-app/frontend
npm install -g vercel
vercel login
vercel link  # vincula con un nuevo o existente Vercel project
```

Esto crea `.vercel/project.json` con el `orgId` y `projectId`.

### 2. Configurar GitHub Secrets

GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Valor | Cómo obtener |
|--------|-------|--------------|
| `VERCEL_TOKEN` | tu token | https://vercel.com/account/tokens → Create |
| `VERCEL_ORG_ID` | `team_xxx` | de `tony-app/frontend/.vercel/project.json` campo `orgId` |
| `VERCEL_PROJECT_ID` | `prj_xxx` | de `tony-app/frontend/.vercel/project.json` campo `projectId` |
| `TONY_ALERT_WEBHOOK` | URL del webhook /alert vía Cloudflare Tunnel | opcional, para notif Telegram en cada deploy |

### 3. Configurar Vercel env vars (UNA VEZ)

Dashboard Vercel → tu proyecto → Settings → Environment Variables:

```
AUTH_SECRET           = openssl rand -base64 32
TONY_USERNAME         = Miguel
TONY_PASSWORD         = <tu password>
NEXT_PUBLIC_API_URL   = https://api.maclorianxgroup.com
```

(Estas las usa el deploy de Vercel directamente, no hace falta meterlas en GitHub.)

### 4. Activar workflows

Push a `main` con cambios en `tony-app/frontend/**` → trigger automático.

O manual desde GitHub → Actions → "Deploy Tony AI to Vercel" → Run workflow.

## Workflows

### deploy-vercel.yml
- Trigger: push a `main` con cambios en frontend
- Steps: checkout → Node 20 → vercel pull → build → deploy --prod
- Notif Telegram al finalizar (success/fail)

### test-frontend.yml
- Trigger: push/PR a `main` o `dev`
- Steps: checkout → Node 20 → npm ci → tsc --noEmit → next build
- Sin secrets, sin deploy. Solo valida que compile.

## Troubleshooting

### "Vercel CLI: missing project link"
→ Ejecutaste `vercel link` localmente? Verifica `.vercel/project.json` en el repo.

### "Auth error en build"
→ AUTH_SECRET debe estar en Vercel env vars (no en GitHub secrets para el build, sí para production runtime).

### Frontend deployado pero no se conecta al backend
→ Verifica `NEXT_PUBLIC_API_URL` apunta a tu Cloudflare Tunnel URL en Vercel env vars.
→ El tunnel debe estar corriendo (`Get-Service cloudflared` debe decir "Running").

## Roadmap

- [ ] Backend deploy: actualmente Flask corre local. Si querés deploy backend también:
  - Opción A: Railway/Fly.io con Dockerfile
  - Opción B: mantener local + Cloudflare Tunnel (current setup)
- [ ] PR preview deploys: agregar trigger en `pull_request` además de push
- [ ] Slack notifications: agregar paso post-deploy con webhook Slack
