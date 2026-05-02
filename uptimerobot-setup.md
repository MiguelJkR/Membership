# UptimeRobot setup — MacLorian X Group ecosystem

## Free tier (recomendado para empezar)
- 50 monitores HTTPS
- Check cada 5 min
- Alertas por email gratis (Telegram/Slack/SMS son add-ons)

## Setup (15 min total)

### 1. Crear cuenta
1. https://uptimerobot.com → Sign Up (free)
2. Usar `contact@maclorianxgroup.com` para alertas centralizadas
3. Verificar email

### 2. Agregar monitores

UptimeRobot free **no** tiene bulk import por CSV — hay que agregarlos uno a uno (5 min para los 6).

Para cada uno:
- Dashboard → **+ Add New Monitor**
- Monitor Type: **HTTP(S)**
- Friendly Name + URL (de la lista abajo)
- Monitoring Interval: **5 minutes**
- Alert Contacts: marcar el email
- Save

| Friendly Name | URL |
|---|---|
| MacLorian X Group | https://maclorianxgroup.com |
| DEDUTH Academy | https://www.deduthacademy.com |
| DEDUTH Academy app | https://app.deduthacademy.com |
| DEDUTH KIDS | https://kids.deduthacademy.com |
| Investigación cuestionario | https://investigacion.maclorianxgroup.com |
| TRASLAPP marketing | https://traslapp-marketing.vercel.app |

### 3. Status page público (opcional, gratis)
- Dashboard → **Status Pages** → New Status Page
- Subdomain: `maclorianxgroup.statuspage.io` (o subdominio propio si pagás)
- Marcar los 6 monitores
- Color/logo: opcional

### 4. Alertas avanzadas (opcional)
- **Telegram bot** (gratis): Add Alert Contact → Telegram → seguir flujo del bot
- **SMS**: requiere comprar créditos
- **Webhook a Slack**: gratis, requiere webhook URL del workspace

## Si después saltás a Pro ($8/mes)
- Bulk import por CSV → usar `uptimerobot-monitors.csv` en este mismo folder
- Check cada 1 min (en vez de 5)
- 100 SMS/mes incluidos
- Status page con dominio custom

## Cert expiry warning
UptimeRobot free **no** monitorea SSL expiry. Para eso:
- **SSL Expiry Monitor** (free, solo cert): https://www.ssllabs.com — manual
- **Better Stack** ($25/mes) — incluye SSL monitoring + uptime
- Vercel: emite cert vía Let's Encrypt automáticamente cada 60-90 días, así que en práctica no hace falta a menos que migrés DNS

## Resumen
1. Sign up free
2. Agregá los 6 monitores manualmente (CSV está en `uptimerobot-monitors.csv` para referencia)
3. Email alerts ya funcionan
4. (Opcional) status page pública + Telegram bot
