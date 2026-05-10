# TONY AI · Production Deploy Guide

**Goal:** que `tony.maclorianxgroup.com` te dé el dashboard desde cualquier red, gratis y persistente.

**Tiempo estimado:** 30-45 min (mayor parte es esperar DNS propagation).

---

## Pre-requisitos (una sola vez)

1. **Cuenta Vercel** (gratis): https://vercel.com/signup
   - Recomendado: registrarse con GitHub para auto-deploy on push
2. **Cuenta Cloudflare** (gratis): https://dash.cloudflare.com/sign-up
3. **Dominio en Cloudflare DNS** (si todavía está en Squarespace):
   - Cloudflare → Add Site → `maclorianxgroup.com` → Free plan
   - Copiar los 2 nameservers que te dan (ej: `xyz.ns.cloudflare.com`)
   - Squarespace → Domain Settings → Custom Nameservers → pegar los 2
   - Esperar 1-24h para propagation (sitio sigue online mientras tanto)

---

## Phase 1 · Vercel deploy (frontend)

```powershell
cd D:\Dev\projects\Membership\tony-app\frontend

# Login (abre browser para auth)
vercel login

# Preview deploy (primer test)
vercel
# → te da URL tipo https://frontend-abc123.vercel.app

# Verificar que funciona, después production
vercel --prod
```

### Configurar env vars en Vercel

Después del primer deploy, agregar las env vars (Vercel Dashboard → Project → Settings → Environment Variables, o via CLI):

```powershell
vercel env add AUTH_SECRET production
# Pegar el valor de tu .env.local actual

vercel env add TONY_USERNAME production
# Miguel

vercel env add TONY_PASSWORD production
# tu password actual

vercel env add NEXT_PUBLIC_API_URL production
# https://api.maclorianxgroup.com  (lo configuramos en Phase 2)
```

Después: re-deploy para que tome las env vars:

```powershell
vercel --prod
```

### Custom domain

```powershell
vercel domains add tony.maclorianxgroup.com
```

Vercel te da un CNAME para configurar en Cloudflare DNS:
- Cloudflare DNS → Add record → CNAME `tony` → `cname.vercel-dns.com` → Proxy: ON
- Esperar ~5 min propagación

---

## Phase 2 · Cloudflare Tunnel (backend persistente)

cloudflared ya está instalado (`C:\Program Files (x86)\cloudflared\cloudflared.exe`).

```powershell
$cf = "C:\Program Files (x86)\cloudflared\cloudflared.exe"

# 1. Login (abre browser)
& $cf tunnel login

# 2. Crear tunnel
& $cf tunnel create tony-api

# 3. Mapear subdominio
& $cf tunnel route dns tony-api api.maclorianxgroup.com
```

### Config file

Crear `C:\Users\migue\.cloudflared\config.yml`:

```yaml
tunnel: tony-api
credentials-file: C:\Users\migue\.cloudflared\<UUID>.json

ingress:
  - hostname: api.maclorianxgroup.com
    service: http://localhost:8765
  - service: http_status:404
```

Para encontrar el UUID:
```powershell
& $cf tunnel list
```

### Test manual

```powershell
& $cf tunnel run tony-api
# Ctrl+C cuando confirmes que funciona
```

En otra terminal:
```powershell
curl https://api.maclorianxgroup.com/api/health
# Debería retornar el JSON de health
```

### Auto-start permanente (Windows service)

```powershell
# Como administrador
& $cf service install
```

Ahora cloudflared corre 24/7 al boot. Verifica:
```powershell
Get-Service cloudflared
```

---

## Phase 3 · Verificación final

```powershell
# Frontend OK?
curl -I https://tony.maclorianxgroup.com

# Backend OK?
curl https://api.maclorianxgroup.com/api/health

# Tony Agent OK?
curl -X POST https://api.maclorianxgroup.com/api/tony_agent/run `
  -H "Content-Type: application/json" `
  -d '{"goal":"di hola"}'
```

---

## Phase 4 · PWA install en celular

1. Abrí `https://tony.maclorianxgroup.com` en Chrome del celular
2. Login con `Miguel` / tu password
3. Tap menú → "Add to Home Screen" / "Instalar app"
4. Tony queda en la home como app nativa

---

## Troubleshooting

### "Not Found" en api.maclorianxgroup.com
- Verifica que cloudflared está corriendo: `Get-Service cloudflared`
- Verifica config.yml apunta a `localhost:8765`
- Verifica Flask escucha: `netstat -ano | findstr :8765`

### "Auth error" en frontend
- env vars no se pasaron al build
- Re-correr: `vercel env add AUTH_SECRET production` y `vercel --prod`

### CORS errors en /api/tony_agent
- Backend ya tiene CORS para localhost. Para producción:
  - Editar `tony_dashboard.py` función `add_cors`
  - Agregar `tony.maclorianxgroup.com` a la lista permitida

### Cloudflare Tunnel se desconecta
- Verifica que tu PC no entra en suspend
- Power Settings → Sleep = Never (cuando enchufado)
- O usar `cloudflared service install` (corre como service)

---

## Auto-deploy en cambios

Si conectaste Vercel a GitHub:
- Cualquier `git push` a `main` → auto-deploy a producción
- Branches → preview deploys automáticos

---

## Costos finales

| Servicio | Tier | Costo |
|----------|------|-------|
| Vercel hobby | 100GB bandwidth | $0 |
| Cloudflare Tunnel free | unlimited | $0 |
| Cloudflare DNS free | unlimited | $0 |
| Domain maclorianxgroup.com | ya tenés | $0 marginal |
| **Total mensual** | | **$0** |

---

## Script automatizado

Para correr todo en una sola pasada (con prompts cuando sea necesario):

```powershell
cd D:\Dev\projects\Membership\tony-app
.\deploy_tony.ps1
```
