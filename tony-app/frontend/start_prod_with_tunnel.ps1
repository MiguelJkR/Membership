# Tony AI — Start prod server + Cloudflare Tunnel + auto-link NEXTAUTH_URL
#
# USAGE:
#   .\start_prod_with_tunnel.ps1
#
# Flow:
#   1. Kill any process on :3000
#   2. Start cloudflared tunnel in background → capture HTTPS public URL
#   3. Start `next start` with NEXTAUTH_URL env pointing to that URL
#   4. Print all access URLs (PC / LAN / public HTTPS)

$ErrorActionPreference = "Stop"
$FE_DIR = "D:\Dev\projects\Membership\tony-app\frontend"
Set-Location $FE_DIR

# 1. Free port 3000
$pid3000 = (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue).OwningProcess
if ($pid3000) {
    Write-Host "[1] Killing existing process on :3000 (PID=$pid3000)" -ForegroundColor Yellow
    Stop-Process -Id $pid3000 -Force -ErrorAction SilentlyContinue
    Start-Sleep 2
}

# 2. Start cloudflared tunnel
Write-Host "[2] Starting Cloudflare Tunnel..." -ForegroundColor Cyan
$tunnelLog = "$env:TEMP\tony_tunnel.log"
Remove-Item $tunnelLog -ErrorAction SilentlyContinue
Start-Process -FilePath "cloudflared" `
    -ArgumentList "tunnel --url http://localhost:3000 --no-autoupdate" `
    -RedirectStandardOutput $tunnelLog `
    -RedirectStandardError "$env:TEMP\tony_tunnel.err.log" `
    -WindowStyle Hidden

# Wait for tunnel URL to appear in log
$tunnelUrl = $null
$tries = 0
while (-not $tunnelUrl -and $tries -lt 30) {
    Start-Sleep 1
    if (Test-Path $tunnelLog) {
        $logContent = Get-Content $tunnelLog -Raw -ErrorAction SilentlyContinue
        if ($logContent -match "https://([a-z0-9-]+\.trycloudflare\.com)") {
            $tunnelUrl = "https://" + $matches[1]
        }
    }
    if (Test-Path "$env:TEMP\tony_tunnel.err.log") {
        $errContent = Get-Content "$env:TEMP\tony_tunnel.err.log" -Raw -ErrorAction SilentlyContinue
        if ($errContent -match "https://([a-z0-9-]+\.trycloudflare\.com)") {
            $tunnelUrl = "https://" + $matches[1]
        }
    }
    $tries++
}
if (-not $tunnelUrl) {
    Write-Host "[!] Tunnel URL not detected in 30s. Check $tunnelLog" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Tunnel URL: $tunnelUrl" -ForegroundColor Green

# 3. Start next start with NEXTAUTH_URL pointing to tunnel
Write-Host "[3] Starting Next.js prod server..." -ForegroundColor Cyan
$env:NEXTAUTH_URL = $tunnelUrl
$env:AUTH_TRUST_HOST = "true"
Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c set NEXTAUTH_URL=$tunnelUrl&& set AUTH_TRUST_HOST=true&& npx --no-install next start --port 3000" `
    -WorkingDirectory $FE_DIR `
    -WindowStyle Hidden

# Wait for server ready
$ready = $false
$tries = 0
while (-not $ready -and $tries -lt 30) {
    Start-Sleep 1
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3000/login" -UseBasicParsing -TimeoutSec 3
        if ($r.StatusCode -eq 200) { $ready = $true }
    } catch {}
    $tries++
}

# 4. Print URLs
$lanIp = (Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  TONY AI ESTA LISTO" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  PC local:        http://localhost:3000" -ForegroundColor White
Write-Host "  LAN (telefono):  http://$($lanIp):3000" -ForegroundColor White
Write-Host "  HTTPS publico:   $tunnelUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Tunnel log:      $tunnelLog" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para detener todo:"
Write-Host "  Get-Process cloudflared,node | Stop-Process -Force" -ForegroundColor Gray
