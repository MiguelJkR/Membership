# PROMPT PARA CLAUDE DESIGN — Tony AI completo

**Instrucciones de uso:** copiá TODO el contenido de abajo y pegalo en el campo "Describe lo que quieres crear..." de claude.ai/design. Incluye stack, 17 rutas, 22 tools, 7 agentes editables, 10 iteraciones de features.

---

```
Quiero terminar el diseño de Tony AI · MacLorian X Group. La estética es cyberpunk-monitorial: fondo #050a14, acentos cyan #00e5ff y verde #4ade80, fuente mono Consolas, scanlines sutiles, glow halos, badges con tracking-widest, tarjetas con bordes 1px translúcidos. Todas las páginas tienen TopBar fija + Sidebar colapsable + TickerTape con precios live + FooterNav móvil. La página existente "Tony AI.html" muestra Dashboard básico. Quiero que extiendas el diseño con TODAS estas features que ya están implementadas en backend Flask :8765 + frontend Next.js :3000.

═══════════════════════════════════════════════════════════════════
NAVEGACIÓN — 17 RUTAS
═══════════════════════════════════════════════════════════════════

Sidebar items (con iconos lucide-react):
1. Panel /              → home dashboard cyberpunk con Tony Character
2. Chat Tony /chat      → conversación libre con Tony Agent (LLM)
3. Empresa /company     → MacLorian X Group profile + 4 productos live
4. Posts Sociales /social-manager → queue + A/B testing + intent URLs (Twitter/LinkedIn/IG/TikTok)
5. Trading /trading     → posiciones Moomoo + OANDA en vivo
6. Agentes IA /agents   → CONSOLA AGENTIC con 4 tabs (★ EXPANDIR ESTE)
7. Flujos n8n /workflows → 91 workflows + click-to-detail panel
8. Email /email         → drafts Gmail + inbox summary
9. Noticias /news       → 18 tickers (positions + watchlist + forex + crypto + indices)
10. Investigación /research → YouTube RAG (15 videos, chromadb, Whisper-Groq)
11. Modo Matrix /matrix → cyberpunk visual mode
12. Intel Social /social → Twitter/Reddit sentiment tracking
13. Seguridad /security → permisos + audit log
14. Automatización /automation → cron jobs + watchdog
15. Análisis /analytics → P/L histórico + sparklines Chart.js
16. Bóveda /vault       → password vault AES-GCM 256, PBKDF2-SHA256 600K, ZERO-KNOWLEDGE, con import .txt/.csv/.json (LastPass/Bitwarden/1Password)
17. Ajustes /settings   → config user + tema

═══════════════════════════════════════════════════════════════════
PÁGINA /agents — LA MÁS RICA — 4 TABS
═══════════════════════════════════════════════════════════════════

TopBar con health badge ❤ 58-100 según composite_score (verde/ámbar/rojo)
+ ExplicaPanel arriba: status conversacional auto-refresh 60s, expand button "DETALLE"

TAB 1 · TONY (consola agéntica)
─ Card cyan glow scanline:
  ├─ Avatar Bot circular border-2 cyan glow
  ├─ Textarea grande "Pídele a Tony cualquier cosa..."
  ├─ 3 chips ejemplo de goals (clickeables)
  ├─ Botón EJECUTAR cyan
  └─ Botón HISTORIAL → muestra Card con sesiones recientes

─ Trace de sesión activa (cuando hay):
  ├─ StatusBadge: EJECUTANDO/COMPLETADO/APROBACIÓN/ERROR/MAX_ITER
  ├─ Badge purple "MEMORIA · N matches" si memory_used
  ├─ Badge "ESPECIALISTA · RISK_MANAGER" si specialist mode active
  ├─ Trace timeline:
  │   - Assistant entries (Bot icon + iteration + model + tool_calls list)
  │   - Tool result entries (icon por tipo + ok/error + preview)
  │   - Approval pause entries (ámbar)
  │   - LLM error entries (rojo)
  └─ Panel de aprobación cuando needs_approval:
      ├─ Banner ámbar "Tony solicita aprobación"
      ├─ tool name + description + args en JSON pretty
      └─ 3 botones: ✓ Una vez (verde) · ✓ Siempre (cyan) · ✗ Rechazar (rojo)

─ Final answer card verde cuando complete

─ Catálogo "Herramientas disponibles · 22 tools":
  Read-only (15 con icon ✓):
    read_file, list_dir, glob, grep
    web_fetch, web_search, web_research
    n8n_list_workflows, n8n_recent_errors, n8n_get_workflow, n8n_get_execution
    moomoo_query, portfolio_snapshot, tony_dashboard_endpoint
    memory_recall, list_agent_sessions
  Gated 🔒 con icono shield (6):
    shell_exec, write_file, edit_file
    n8n_trigger, python_eval, telegram_send

TAB 2 · ESPECIALIZADOS (editable!)
─ Header bar con stats: "7 agentes · 5 activos"
─ Botón EDITAR cyan / AÑADIR verde / GUARDAR
─ Grid 3 cols de AgentCards con:
  Cada card border-2 con accent color, icon circular, badge OFF si disabled,
  trigger_keywords como chips, lista de workflows linked con dot pulsante

  AGENTES (con sus colores):
  1. AI_ANALYST · cyan · Brain icon
     "Análisis fundamental + técnico de portfolio"
     keywords: análisis, rebalance, concentración, portfolio
  2. MARKET_SCANNER · cyan · Activity icon
     "Busca oportunidades técnicas en watchlist + mercado"
     keywords: scanner, oportunidad, señal, signal, buy zone
  3. RISK_MANAGER · red · AlertTriangle icon
     "Drawdown + stop-loss + margin + position sizing"
     keywords: riesgo, risk, drawdown, stop, exposure
  4. NEWS_AGENT · amber · Newspaper icon
     "Macro + sector news + earnings + Fed events"
     keywords: noticias, news, earnings, fed, cpi, macro
  5. SOCIAL_WATCHER · purple · Eye icon (OFF default)
     "Twitter/Reddit/Telegram sentiment tracking"
     keywords: sentiment, twitter, reddit, wsb, buzz
  6. EXECUTION_BOT · green · Zap icon (OFF default — PDT ban)
     "Ejecuta orders OANDA/Moomoo (CON aprobación)"
     keywords: ejecutar orden, place order, buy, sell, trade
  7. STRATEGY_AI · cyan · Sparkles icon
     "Genera setups + backtests via Groq + Ollama"
     keywords: estrategia, strategy, backtest, optimize, sharpe

─ Modo edición: cada card cambia a form con inputs name/role/accent/keywords + checkbox enabled + botón ELIMINAR rojo

─ Card debajo "GUÍA EDICIÓN" con instrucciones

TAB 3 · ERRORES (real-time monitoring)
─ Tab button con badge rojo si hay errores 24h
─ 4 KPI tiles: TOTAL ERRORES · WORKFLOWS AFECTADOS · MÁS RECIENTE · AUTO-REFRESH 30s
─ Timeline 24h: bar chart con buckets horarios
  · verde claro = 0 errores
  · ámbar = 1-3
  · rojo intenso = 4+
─ Lista POR WORKFLOW: nombre + count badge rojo + timestamp más reciente
─ Lista TIMELINE: cada error con XCircle red + ts + workflow + mode

TAB 4 · MÉTRICAS (performance)
─ 5 KPI tiles cyan/green/amber/purple:
  · SESIONES (total)
  · COMPLETION % (verde >70%, ámbar 40-70%, rojo <40%)
  · AVG ITER (promedio iteraciones)
  · MEMORIA USO % (cuántas sesiones usaron recall)
  · TOOLS USED (variedad)
─ Timeline 7 días: bar chart stacked verde (complete) + rojo (error)
─ Top 10 tools ranking con bars horizontales cyan

─ Card final "PROVEEDORES LLM · ACTIVOS":
  · GROQ · PRINCIPAL (llama-3.3-70b-versatile, cascada al 8b)
  · OLLAMA · RESPALDO LOCAL (llama3.2:3b, CPU 1.9GB)
  · ANTHROPIC · A DEMANDA (claude-sonnet-4-6, visión + thinking)

═══════════════════════════════════════════════════════════════════
TOPBAR — STATUS GLOBAL
═══════════════════════════════════════════════════════════════════

Izquierda:
  - Pill "SISTEMA EN LÍNEA" verde con dot pulsante O "OFFLINE" rojo
  - Pill "AUTÓNOMO · MULTI-AGENTE" con icon Activity
  - ❤ Health badge: "58/100" o "100/100" con color, suffix "Nerr" si hay errores

Centro:
  - CAPITAL REAL $X,XXX en cyan
  - P/L $X verde positivo / rojo negativo

Derecha:
  - Botón Volume2 → Tony habla TTS
  - Bell con counter rojo de alerts
  - Pill MIGUEL con User icon
  - LogOut button

═══════════════════════════════════════════════════════════════════
DASHBOARD HOME — Panel /
═══════════════════════════════════════════════════════════════════

Hero:
  - "Bienvenido, Operador" en verde gigante (fuente Display)
  - Subtítulo: "TONY · v2.0.1 · SISTEMA AUTÓNOMO DE TRADING"
  - "Resumen del sistema en tiempo real. TONY orquesta 7 agentes
     autónomos en 8 mercados — analizando, ejecutando y rebalanceando
     24/7 mediante 91 workflows n8n."

Grid 3 cols KPIs:
  - CAPITAL TOTAL: $XXX con sparkline + delta % 24h
  - GANANCIAS (7D): $XXX con sparkline verde
  - OPERACIONES (24H): N + Win Rate %

Grid lower:
  - RENDIMIENTO DEL PORTFOLIO con tabs 24H · 7D · 30D · 90D · 1Y
  - ACTIVIDAD RECIENTE: lista de últimas trades + "VER TODOS"
  - WatchlistAlerter active triggers (9): AAL @ $13.20 trim, AAL @ $11.80 stop, etc

═══════════════════════════════════════════════════════════════════
TRADING /trading
═══════════════════════════════════════════════════════════════════

Tabs: REAL · DEMO · WATCHLIST
─ Tabla de posiciones Moomoo: symbol, shares, avg_cost, MV, P/L $/%, stop_loss
─ ONDS hold_strategy="long_term" (note especial)
─ AAL con stop note "vender todo sin dudar"
─ Mini chart por position (Chart.js)

Panel "TRADING ADVISOR" (nuevo):
─ Market status: weekend/pre-market/market open/after-hours
─ VIX + regime: NORMAL/HIGH/EXTREME
─ Recommendations priorizadas por severity:
  🚨 CRITICAL · ⚠ HIGH · • INFO
─ Near triggers list con distance% al target

OANDA section:
─ EUR/USD, GBP/USD, USD/JPY pairs
─ Equity curve sparkline
─ Open positions count

═══════════════════════════════════════════════════════════════════
INVESTIGACIÓN /research — YouTube RAG
═══════════════════════════════════════════════════════════════════

KPIs row: VIDEOS INDEXADOS 15 · MODELO MiniLM-L6 · DIMENSIONES 384 · ALMACÉN chromadb

Card "CONSULTAR BASE DE CONOCIMIENTO":
─ Textarea grande "¿Qué dice X sobre Y?"
─ Botón CONSULTAR cyan
─ 5 sample queries chips: "EUR USD outlook", "Fed interest rate impact 2026", etc
─ Result block: SÍNTESIS · N COINCIDENCIAS + sources con video_id + similarity

Card "VIDEOS YA INDEXADOS":
─ Lista de 15 video_ids con ExternalLink
─ Pipeline: youtube-transcript-api → chunk 400p/40 overlap → MiniLM embed → chromadb upsert

Card "INDEXAR NUEVO VIDEO":
─ Input URL (acepta /watch, /shorts, /live)
─ Botón INDEXAR
─ Status panel inline (color-coded, no alerts)

═══════════════════════════════════════════════════════════════════
BÓVEDA /vault — Password Manager
═══════════════════════════════════════════════════════════════════

Lock screen cuando bloqueada:
─ Avatar Lock + "Bóveda Bloqueada"
─ Subtitulo: ENCRIPTACIÓN AES-GCM 256 · PBKDF2-SHA256 600K · ZERO-KNOWLEDGE
─ Counter: N entradas encriptadas
─ Input contraseña maestra centrado
─ Botón DESBLOQUEAR cyan
─ Footer ámbar: "ZERO-KNOWLEDGE · La contraseña maestra NUNCA se envía al servidor"

Vista desbloqueada:
─ MiniMetrics: TOTAL · TRADING · BANKING · EMAIL · APIS · PERSONAL
─ Search input + filtro categoría dropdown
─ Botones: IMPORTAR (ámbar) · NUEVA ENTRADA (verde) · BLOQUEAR (rojo)
─ Grid 3 cols de credenciales:
  Cada card con: KeyRound icon, label, username, password mask + reveal/copy, URL link, edit/delete

Modal IMPORTAR:
─ File picker .txt/.csv/.json
─ O paste textarea
─ Auto-detect formato (LastPass, Bitwarden, 1Password, genérico)
─ Preview list con checkboxes
─ Categoría dropdown + checkbox "aplicar a todas"
─ Botón ENCRIPTAR E IMPORTAR

═══════════════════════════════════════════════════════════════════
FLUJOS /workflows — n8n
═══════════════════════════════════════════════════════════════════

Stats: 91 workflows totales (recent: 95 con los nuevos)
─ Tony Self-Diagnoser Cron (cada 30min)
─ Tony Executive Report Daily (8am ET)
─ Watchlist Alerter Cron (5min market hours)
─ Tony Backup Weekly (domingo 23:00)
─ Tony Agent · Telegram Bridge (webhook + voice)

Tabla con búsqueda:
─ name, status pill (active/inactive), nodes count, executions 24h, error count
─ Click row → side panel detail con nodes + connections + last execution

═══════════════════════════════════════════════════════════════════
SEGURIDAD /security
═══════════════════════════════════════════════════════════════════

─ HMAC approval tokens (verified internally, 60s TTL)
─ Allowlist paths: .claude-agent, D:/Dev/projects, Downloads, Documents
─ Block paths: API keys, vault, Windows, Program Files
─ Audit log chain (HMAC-SHA256 chained for tamper evidence)
─ Approval patterns persistent (cross-session memory)

═══════════════════════════════════════════════════════════════════
ESTÉTICA — TOKENS DE DISEÑO
═══════════════════════════════════════════════════════════════════

Colores:
  --color-bg:        #050a14 (deep navy)
  --color-bg-card:   #0a1525
  --color-cyan:      #00e5ff (primary accent)
  --color-green:     #4ade80 (success)
  --color-red:       #ef4444 (errors)
  --color-amber:     #fbbf24 (warnings)
  --color-text:      #c0e0ff
  --color-text-dim:  #6b7d99
  --color-border:    rgba(0,229,255,0.15)

Glow:
  .glow-cyan: 0 0 20px var(--color-cyan), 0 0 40px var(--color-cyan)/0.4
  .glow-green: similar verde

Tipografía:
  - Body: Inter / system-ui (mono optional)
  - Mono: 'Consolas','SF Mono','Monaco' para datos/code/timestamps
  - Display: variant grande para headers hero

Componentes recurrentes:
  - Card: rounded-lg, border-1px translúcido, opcional scanline animation, opcional glow
  - StatusBadge: tracking-widest font-mono uppercase pill border-1
  - MiniMetric: stack vertical {label small dim, value large mono accent}
  - PageHeader: title + subtitle mono dim + action area
  - PageTransition: framer-motion fade slide-up entre rutas
  - ScrollableTrace: max-h-60vh overflow-y-auto

═══════════════════════════════════════════════════════════════════
INTERACCIONES
═══════════════════════════════════════════════════════════════════

- Hover en cards = border accent color brighter + glow halo
- Click en sample query chip = pre-llena el textarea
- Click en goal example = pre-llena agent input
- Toggle EDITAR en specialized = transforma cards a forms inline
- Auto-refresh: TopBar 45s, Errors tab 30s, Metrics 60s, Tony Explica 60s
- Voice button TopBar = abre prompt para TTS

═══════════════════════════════════════════════════════════════════
DATOS DEMO PARA POBLAR
═══════════════════════════════════════════════════════════════════

Portfolio actual (Moomoo Cash #5125, owner Miguel · Cape Coral FL):
- AAL: 196 sh @ $10.72 → MV $2,582.30, P/L +$481.17 (+18.6%), stop $11.00
- ONDS: 20 sh @ $11.08 → MV $178.60, P/L -$42.97, long-term hold
- NVDA: 1.0087 sh @ $188.90 → MV $216.95, P/L +$26.41, stop $170
- MSFT: 0.3522 sh @ $519.16 → MV $146.08, P/L -$36.77 (no stop)

Watchlist alerts activas:
- AAL_TRIM > $13.20 (trim 50%, lunes 12-may)
- AAL_STOP < $11.80 (sell all crítico)
- JBLU_BUY < $5.00, JBLU_MOMENTUM > $6.00
- INTC_BUY < $95, INTC_BREAKOUT > $120
- CRNC_REENTRY < $8.50
- ONDS_THESIS_BREAK < $5.00

VIX: ~17.2 (NORMAL regime)

LLM proveedores activos:
- Groq llama-3.3-70b (cascada 70b → 8b)
- Ollama llama3.2:3b local (1.9GB, fallback)
- Anthropic Claude Sonnet 4.5 (visión + thinking 5k)

═══════════════════════════════════════════════════════════════════
FEATURES AUTÓNOMAS — DOCUMENTAR EN UN HOME PANEL
═══════════════════════════════════════════════════════════════════

Crea un section "TONY ES UN OS AUTÓNOMO COMPLETO" con grid 3x3 de cards:

1. SELF-MONITORING
   "Self-Diagnoser cada 30min revisa errores n8n, lanza Tony Agent para
    investigar, manda diagnóstico por Telegram"

2. SELF-HEALING
   "Auto-Fixer con 6 patterns (P1 timeout, P2 branch, P3 OOM, P4 auth,
    P5 rate-limit, P6 network). Aplica fixes automáticos con allowlist
    + cooldown 6h + audit log"

3. CROSS-SESSION MEMORY
   "Cada decisión de aprobación se guarda. Tony recuerda 'aprobado
    siempre' y auto-skipea pause en futuras sesiones similares.
    18 sesiones embebidas en chromadb (sentence-transformers MiniLM)"

4. VOICE BIDIRECCIONAL
   "Telegram audio → Whisper Groq (large-v3-turbo) → goal Tony Agent.
    Respuesta texto + audio TTS Edge (es-US-AlonsoNeural)"

5. SMART CONTEXT
   "Goal contiene 'AAL' → auto-fetch portfolio entry.
    Goal contiene 'errores' → auto-fetch n8n errors.
    Goal contiene 'estado' → auto-fetch system_status.
    Inyectado al system prompt antes del LLM."

6. SPECIALISTS ROUTING
   "Detecta keywords del goal y activa la persona del agente especialista.
    'analiza riesgo AAL' → MODO ESPECIALISTA · RISK_MANAGER con prompt
    extension específico"

7. ORCHESTRATOR MULTI-STEP
   "Goal complejo → descompone en 2-4 sub-tareas → ejecuta cada una
    pasando contexto → sintetiza respuesta final"

8. EXECUTIVE REPORT
   "Cada día 8am ET, Telegram con resumen: # sesiones, completion%,
    auto-fixes aplicados, watchlist alerts, n8n errors 24h"

9. TRADING ADVISOR
   "Análisis táctico: posiciones vs stops, P/L, market regime VIX,
    near-triggers watchlist. Output priorizado critical/high/info"

═══════════════════════════════════════════════════════════════════
ESTILO FINAL
═══════════════════════════════════════════════════════════════════

- Cyberpunk WATCH_BOT × Bloomberg Terminal
- Mucho mono font para datos numéricos
- Mucho tracking-widest UPPERCASE en labels pequeños (text-[9px] o [10px])
- Glow halos en cards principales
- Scanline subtle horizontal lines para modo Matrix
- Animations sutiles: pulse en dots online, smooth fade en transitions
- Mobile responsive: sidebar colapsable, FooterNav fija con 5 items principales
- Iconos lucide-react en lugar de emoji excepto donde el emoji aporta info (🟢🔴⚠ status)

Marca: TONY · MacLorian X Group · "Autonomous Trading & Automation OS"
```

---

## Cómo usarlo

1. Abrí en el browser: `https://claude.ai/design/h/-Pof4B8gy1d344ctqiNSEg?open_file=Tony+AI.html`
2. En el campo "Describe lo que quieres crear..." pegá TODO lo que está dentro del bloque ``` arriba
3. Dale ENVIA
4. Claude Design va a generar el HTML completo con todas las features
5. Tabs nuevos, agentes editables, métricas, errores, voice, smart context, etc

Si querés que sea más corto/largo, te lo edito.
