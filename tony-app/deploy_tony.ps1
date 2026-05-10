# Tony AI · Production Deploy Script
# Run from: D:\Dev\projects\Membership\tony-app\
# Phase 1: Vercel deploy (frontend)
# Phase 2: Cloudflare Tunnel (backend)
#
# Prerequisites (manuales):
#   - Vercel account: https://vercel.com/signup (gratis)
#   - Cloudflare account: https://dash.cloudflare.com/sign-up (gratis)
#   - Domain maclorianxgroup.com migrado a Cloudflare DNS (~10 min, una vez)

$ErrorActionPreference = "Stop"

# Detect cloudflared path (added to PATH only after restart)
$cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
if (-not (Test-Path $cloudflared)) {
    Write-Host "ERR: cloudflared no encontrado en $cloudflared" -ForegroundColor Red
    Write-Host "Instalar: winget install --id Cloudflare.cloudflared --source winget" -ForegroundColor Yellow
    exit 1
}

Write-Host "===== TONY AI · DEPLOY =====" -ForegroundColor Cyan
Write-Host ""

# ============== PHASE 1 · Vercel ==============
Write-Host "PHASE 1 · Vercel deploy" -ForegroundColor Cyan

Set-Location "D:\Dev\projects\Membership\tony-app\frontend"

# Check Vercel login status
$loggedIn = $false
try {
    $whoami = vercel whoami 2>&1
    if ($whoami -notmatch "Error|not logged") {
        Write-Host "  ✓ Vercel: logueado como $whoami" -ForegroundColor Green
        $loggedIn = $true
    }
} catch {}

if (-not $loggedIn) {
    Write-Host "  → Necesitás loguearte en Vercel. Ejecutando 'vercel login'..." -ForegroundColor Yellow
    vercel login
}

# Deploy preview first (safer)
Write-Host ""
Write-Host "  → Building y desplegando preview..." -ForegroundColor Cyan
vercel --yes
Write-Host ""
Write-Host "  Si el preview se ve bien, ejecutá:" -ForegroundColor Yellow
Write-Host "    vercel --prod" -ForegroundColor White
Write-Host ""
Read-Host "Presiona ENTER cuando hayas hecho 'vercel --prod' y tengas el dominio asignado"

# ============== PHASE 2 · Cloudflare Tunnel ==============
Write-Host ""
Write-Host "PHASE 2 · Cloudflare Tunnel" -ForegroundColor Cyan

# Check existing tunnel
$tunnelExists = $false
try {
    $list = & $cloudflared tunnel list 2>&1
    if ($list -match "tony-api") {
        Write-Host "  ✓ Tunnel 'tony-api' ya existe" -ForegroundColor Green
        $tunnelExists = $true
    }
} catch {
    # Not logged in yet
}

if (-not $tunnelExists) {
    Write-Host "  → Login a Cloudflare (abre browser)..." -ForegroundColor Yellow
    & $cloudflared tunnel login

    Write-Host ""
    Write-Host "  → Creando tunnel 'tony-api'..." -ForegroundColor Yellow
    & $cloudflared tunnel create tony-api

    Write-Host ""
    Write-Host "  → Mapeando subdominio api.maclorianxgroup.com..." -ForegroundColor Yellow
    & $cloudflared tunnel route dns tony-api api.maclorianxgroup.com
}

# Find tunnel UUID
$tunnels = & $cloudflared tunnel list 2>&1 | Select-String "tony-api"
$uuidMatch = [regex]::Match($tunnels.ToString(), "([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})")
if (-not $uuidMatch.Success) {
    Write-Host "  ERR: no pude encontrar el UUID del tunnel" -ForegroundColor Red
    exit 1
}
$tunnelUuid = $uuidMatch.Value
Write-Host "  Tunnel UUID: $tunnelUuid" -ForegroundColor Green

# Write config.yml
$configPath = "$env:USERPROFILE\.cloudflared\config.yml"
$configContent = @"
tunnel: tony-api
credentials-file: $env:USERPROFILE\.cloudflared\$tunnelUuid.json

ingress:
  - hostname: api.maclorianxgroup.com
    service: http://localhost:8765
  - service: http_status:404
"@
$configContent | Out-File -FilePath $configPath -Encoding utf8 -Force
Write-Host "  ✓ Config escrita: $configPath" -ForegroundColor Green

# Test tunnel
Write-Host ""
Write-Host "  → Probando tunnel (60s)..." -ForegroundColor Yellow
$tunnelJob = Start-Job -ScriptBlock {
    param($cf)
    & $cf tunnel run tony-api
} -ArgumentList $cloudflared

Start-Sleep -Seconds 8
$health = $null
try {
    $health = (Invoke-WebRequest -Uri "https://api.maclorianxgroup.com/api/health" -UseBasicParsing -TimeoutSec 15).StatusCode
} catch {
    Write-Host "    Aún propagando DNS — wait 5min y vuelve a probar" -ForegroundColor Yellow
}

Stop-Job $tunnelJob | Out-Null
Remove-Job $tunnelJob -Force | Out-Null

if ($health -eq 200) {
    Write-Host "  ✓ Tunnel OK (api.maclorianxgroup.com responde 200)" -ForegroundColor Green
}

# Install as Windows service for permanent run
Write-Host ""
Write-Host "  → Instalando tunnel como servicio Windows (auto-start on boot)..." -ForegroundColor Yellow
& $cloudflared service install
Write-Host "  ✓ Servicio 'cloudflared' instalado" -ForegroundColor Green

# ============== PHASE 3 · Update Vercel env ==============
Write-Host ""
Write-Host "PHASE 3 · Configurar NEXT_PUBLIC_API_URL en Vercel" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Ejecutá estos comandos manualmente:" -ForegroundColor Yellow
Write-Host "    cd D:\Dev\projects\Membership\tony-app\frontend" -ForegroundColor White
Write-Host "    vercel env add NEXT_PUBLIC_API_URL production" -ForegroundColor White
Write-Host "    # cuando pregunte: https://api.maclorianxgroup.com" -ForegroundColor Gray
Write-Host "    vercel env add AUTH_SECRET production" -ForegroundColor White
Write-Host "    # cuando pregunte: <pegá el AUTH_SECRET de .env.local>" -ForegroundColor Gray
Write-Host "    vercel env add TONY_USERNAME production" -ForegroundColor White
Write-Host "    # cuando pregunte: Miguel" -ForegroundColor Gray
Write-Host "    vercel env add TONY_PASSWORD production" -ForegroundColor White
Write-Host "    # cuando pregunte: <tu password>" -ForegroundColor Gray
Write-Host ""
Write-Host "  Después: vercel --prod  (re-deploy con nuevas env vars)" -ForegroundColor White
Write-Host ""
Write-Host "  Y añadí domain custom:" -ForegroundColor Yellow
Write-Host "    vercel domains add tony.maclorianxgroup.com" -ForegroundColor White
Write-Host ""
Write-Host "===== DEPLOY LISTO =====" -ForegroundColor Green
Write-Host ""
Write-Host "URLs finales (después de propagación DNS):" -ForegroundColor Cyan
Write-Host "  Frontend: https://tony.maclorianxgroup.com" -ForegroundColor White
Write-Host "  Backend:  https://api.maclorianxgroup.com" -ForegroundColor White
Write-Host ""
Write-Host "Ambos auto-arrancan al boot (Vercel always-on, cloudflared como servicio)." -ForegroundColor Gray
