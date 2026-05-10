# Tony AI — Operating System de Trading Autónomo

**MacLorian X Group LLC** · v2.0.1 · Cape Coral, FL

---

## Stack

| Servicio | Puerto | Tech | Rol |
|---|---|---|---|
| Next.js Frontend | 3000 | Next 16 + React 19 + Tailwind v4 | Dashboard PWA |
| Flask Backend | 8765 | Python 3.13 + Flask | API + 45+ endpoints |
| n8n Workflows | 5678 | Node.js + n8n | 47 workflows automation |
| Ollama LLM | 11434 | Local | LLM fallback (llama3.2) |
| Moomoo OpenD | 11111 | Python | Market data + brokerage |
| ML SuperTrend Bot | — | Python | Forex/crypto signals via OANDA |
| Cloudflare Tunnel | — | cloudflared | HTTPS público sin abrir puertos |

---

## URLs de acceso

| Lugar | URL |
|---|---|
| **PC local** | `http://localhost:3000` |
| **LAN / Wi-Fi (móvil)** | `http://192.168.0.26:3000` |
| **HTTPS público (temp)** | URL guardada en `~/.claude-agent/logs/last_tunnel_url.txt` |
| **HTTPS público (fijo, futuro)** | `https://tony.maclorianxgroup.com` (después de setup_named_tunnel) |

---

## Boot / Auto-start

Tony AI arranca automáticamente al login si tenés instalado el Scheduled Task:

```powershell
# UNA SOLA VEZ — click derecho → Run as Administrator
powershell -ExecutionPolicy Bypass -File C:\Users\migue\.claude-agent\install_tony_autostart.ps1
```

Tras eso, cada login dispara `start_tony_all.ps1` que:
1. Levanta Flask (`pythonw`, sin consola)
2. Inicia Cloudflare Tunnel y captura URL HTTPS
3. Inicia Next.js prod con `NEXTAUTH_URL` apuntando a la URL del tunnel

**Logs en**: `~/.claude-agent/logs/start_tony_all.log`

### Manual start (si no usás Scheduled Task)

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\migue\.claude-agent\start_tony_all.ps1
```

### Manual stop

```powershell
# Stop everything
$ports = @(3000, 8765)
foreach ($p in $ports) {
    $pid = (Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue).OwningProcess
    if ($pid) { Stop-Process -Id $pid -Force }
}
Get-Process cloudflared -EA SilentlyContinue | Stop-Process -Force
```

---

## Acceso fácil (sin recordar URLs)

### Shortcuts en Desktop (PC)

Tenés 2 shortcuts auto-instalados en `OneDrive\Escritorio`:
- **Tony AI** → abre `localhost:3000` directo (PC, instantáneo)
- **Tony AI HTTPS** → abre la URL pública del tunnel actual (móvil/4G/desde fuera)

Doble-click → abre el browser. Si Tony AI no está corriendo, el shortcut lo levanta automáticamente.

### Telegram notify (móvil)

Cada vez que se ejecuta `start_tony_all.ps1` (manual o auto-start al boot), te llega un **mensaje de Telegram** desde `@MacLorianxgroup_bot` con:

```
Tony AI esta listo. URLs de acceso:

PC local
http://localhost:3000

Wi-Fi de casa
http://192.168.0.26:3000

HTTPS publico (4G/cualquier red)
https://[fresh-tunnel-url].trycloudflare.com

Backend API
http://localhost:8765/api/health
```

Solo abrís Telegram → click en la URL → entrás. **No tenés que recordar la URL nunca**.

### Endpoint programático

Si necesitás la URL desde código:

```bash
curl http://localhost:8765/api/tunnel_url
# {"ok":true,"url":"https://...trycloudflare.com","source":"..."}
```

---

## URL fija con dominio propio (opcional, si querés)

La URL `*.trycloudflare.com` cambia cada vez que reinicia el tunnel. Para una URL **permanente** con tu dominio:

### Setup (una sola vez)

**Paso 1**: Login en Cloudflare (browser)
```powershell
cloudflared tunnel login
```
- Selecciona `maclorianxgroup.com` cuando pida
- Autoriza la app

**Paso 2**: Run script (instala todo el resto)
```powershell
# Necesita Admin (instala Windows service)
powershell -ExecutionPolicy Bypass -File C:\Users\migue\.claude-agent\setup_named_tunnel.ps1
```

Después de eso:
- `https://tony.maclorianxgroup.com` → frontend Tony AI
- `https://api.tony.maclorianxgroup.com` → backend Flask
- URL **nunca cambia** + tunnel arranca solo al boot (Windows service)

---

## Acceso desde Android / iPhone

### Wi-Fi local (mismo router)

1. Activá firewall una sola vez (necesita Admin):
   ```powershell
   powershell -ExecutionPolicy Bypass -File C:\Users\migue\.claude-agent\enable_lan_access.ps1
   ```
2. Browser del teléfono → `http://192.168.0.26:3000`
3. Login → menú browser → "Añadir a pantalla de inicio" (PWA)

### Desde fuera de casa (4G/5G/otra Wi-Fi)

Usá la URL HTTPS pública (Cloudflare Tunnel):
1. PC tiene tunnel corriendo (auto al boot si instalaste auto-start)
2. URL fija → `https://tony.maclorianxgroup.com` (post named-tunnel setup)
3. URL temporal → leer de `~/.claude-agent/logs/last_tunnel_url.txt`

---

## Frontend dev mode (para iterar diseño)

```powershell
cd D:\Dev\projects\Membership\tony-app\frontend

# Stop prod si está corriendo
$pid = (Get-NetTCPConnection -LocalPort 3000 -State Listen -EA SilentlyContinue).OwningProcess
if ($pid) { Stop-Process -Id $pid -Force }

# Start dev (Turbopack, hot-reload)
npm run dev
```

### Build prod manual

```powershell
cd D:\Dev\projects\Membership\tony-app\frontend
npm run build           # genera .next/
npm run start           # sirve build optimizado en :3000
```

---

## Componentes principales del Dashboard

| Componente | Path | Función |
|---|---|---|
| `Sidebar` | `components/Sidebar.tsx` | Engranaje + items + footer Modo Matrix |
| `TopBar` | `components/TopBar.tsx` | Breadcrumb + search + pills + reloj |
| `LiveTicker` | `components/LiveTicker.tsx` | LIVE indicator + ticker scroll |
| `TonyHero` | `components/TonyHero.tsx` | Hero TONY gigante + globo wireframe |
| `EstadoSistemaCard` | `components/EstadoSistemaCard.tsx` | Bullets verdes/rojos por subsistema |
| `ResumenGeneralCard` | `components/ResumenGeneralCard.tsx` | 4 KPIs con sparklines |
| `RendimientoCard` | `components/RendimientoCard.tsx` | Chart área + tabs 24H/7D/30D/90D + DD/Sharpe/PF/WR |
| `ActividadRecienteCard` | `components/ActividadRecienteCard.tsx` | Avatares circulares + monto + hora |
| `AgentesActivosCard` | `components/AgentesActivosCard.tsx` | Lista bullets + delta % |
| `Radar` | `components/Radar.tsx` | Watch Dogs radar circular animado (no en home actual) |

---

## Auto-cleanup ventanas Python

Tony AI elimina las consolas Python parpadeantes via:

**Archivo**: `C:\Users\migue\AppData\Roaming\Python\Python313\site-packages\usercustomize.py`

Python lo importa **automáticamente** en TODO proceso. El patch:
- `subprocess.Popen.__init__` → siempre con `creationflags=CREATE_NO_WINDOW`
- Reescribe `["python", ...]` → `["pythonw.exe", ...]` para que ningún hijo abra consola

Cobertura: Tony Dashboard, Watchdog, ML Bot, todos los crons, scripts ad-hoc, n8n Execute Command nodes.

---

## Troubleshooting

### "No me deja login en el celular"
- Verificá que `NEXTAUTH_URL` apunte a la URL HTTPS pública:
  ```powershell
  Invoke-WebRequest http://localhost:3000/api/auth/providers | Select-Object -ExpandProperty Content
  ```
  El `signinUrl` y `callbackUrl` deben ser HTTPS no `0.0.0.0`

### "Veo versión vieja del Dashboard"
- Service Worker cache. Solución:
  - PC: `Ctrl+Shift+R` (hard refresh)
  - Si persiste: F12 → Application → Service Workers → Unregister → Storage → Clear site data
  - Android PWA: desinstalar la PWA → reinstalar

### "Salen ventanas Python parpadeando"
- Verificá que `usercustomize.py` tenga el patch:
  ```bash
  grep "_tony_no_window_wrapped" "C:\\Users\\migue\\AppData\\Roaming\\Python\\Python313\\site-packages\\usercustomize.py"
  ```
- Reiniciá Flask con `pythonw` (no `python`)

### "Cloudflare Tunnel URL no responde"
- Check tunnel running: `Get-Process cloudflared`
- Check log: `Get-Content "$env:USERPROFILE\.claude-agent\logs\cloudflared.log" -Tail 30`
- Restart: kill cloudflared → run `start_tony_all.ps1` de nuevo

---

## Roadmap pendiente

- [ ] Setup tunnel nombrado con dominio fijo (después de cloudflare login)
- [ ] Refactor pages restantes al estilo Claude Design (workflows, watchlist, vault, news, etc.)
- [ ] Health check externo (UptimeRobot ya monitoring n8n, agregar Tony AI)
- [ ] Backup automático de `.next/` build a vault
- [ ] Multi-user invites + role-based UI rendering

---

**Última actualización**: 2026-05-09 · Brain v2.0.1
