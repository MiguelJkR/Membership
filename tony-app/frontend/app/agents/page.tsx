"use client";
import { useEffect, useRef, useState } from "react";
import { api, type AgentSessionResponse, type AgentTraceEntry, type AgentConfig } from "@/lib/api";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import {
  Activity, AlertTriangle, Eye, Newspaper, Brain, Zap, Play, Send,
  Loader2, CheckCircle2, XCircle, ShieldAlert, Wrench, FileText,
  Globe, Terminal, Sparkles, Pause, ChevronRight, Bot, History,
  Edit2, Save, Plus as PlusIcon, X as XIcon, Trash2
} from "lucide-react";

const SPEC_AGENTS = [
  { id: "market_scanner", name: "MARKET_SCANNER", role: "Busca oportunidades técnicas", icon: Activity, accent: "cyan", workflows: ["ML Signals Watcher", "Autonomous Equity Scanner"] },
  { id: "risk_manager", name: "RISK_MANAGER", role: "Drawdown + stop-loss + margin", icon: AlertTriangle, accent: "red", workflows: ["Drawdown Circuit Breaker", "Stop Trailing Daily", "Risk Dashboard Daily"] },
  { id: "social_watcher", name: "SOCIAL_WATCHER", role: "Twitter/Reddit/Telegram sentiment", icon: Eye, accent: "purple", workflows: ["Sentiment Snapshot", "Sentiment Regime Alerts"] },
  { id: "news_agent", name: "NEWS_AGENT", role: "Macro + sector news", icon: Newspaper, accent: "amber", workflows: ["Macro Pre-Alert", "Earnings Pre-Alert"] },
  { id: "execution_bot", name: "EXECUTION_BOT", role: "Ejecuta orders OANDA/Moomoo", icon: Zap, accent: "green", workflows: ["OANDA Position Manager", "Sentiment Regime Trader", "Autonomous Strategy Engine"] },
  { id: "strategy_ai", name: "STRATEGY_AI", role: "Genera setups via Groq+Ollama", icon: Brain, accent: "cyan", workflows: ["Brain DMN", "Brain Sleep Cycle", "Brain User Model Updater"] },
];
const ACCENT: Record<string, string> = {
  cyan: "border-[var(--color-cyan)] text-[var(--color-cyan)] bg-[var(--color-cyan)]/5",
  green: "border-[var(--color-green)] text-[var(--color-green)] bg-[var(--color-green)]/5",
  red: "border-[var(--color-red)] text-[var(--color-red)] bg-[var(--color-red)]/5",
  amber: "border-[var(--color-amber)] text-[var(--color-amber)] bg-[var(--color-amber)]/5",
  purple: "border-purple-400 text-purple-400 bg-purple-400/5",
};

const EXAMPLE_GOALS = [
  "Cuántos archivos .py hay en el directorio .claude-agent",
  "Lista los workflows n8n inactivos",
  "Lee el README del proyecto frontend y resume el stack",
  "Busca en el código toda función que use 'oanda_executor' y dime dónde está",
  "Dame el snapshot del portfolio Moomoo y calcula el % de cada posición",
  "Busca noticias de la última hora sobre AAL",
];

const TOOL_ICONS: Record<string, typeof FileText> = {
  read_file: FileText, list_dir: FileText, glob: FileText, grep: FileText,
  web_fetch: Globe, web_search: Globe,
  shell_exec: Terminal, python_eval: Terminal,
  write_file: Wrench, edit_file: Wrench,
  n8n_list_workflows: Sparkles, n8n_trigger: Sparkles,
  moomoo_query: Activity, portfolio_snapshot: Activity,
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<any>({});
  const [tab, setTab] = useState<"agent" | "specialized" | "errors" | "metrics" | "feedback">("agent");
  const [tools, setTools] = useState<any[]>([]);
  const [goal, setGoal] = useState("");
  const [session, setSession] = useState<AgentSessionResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [errorsData, setErrorsData] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<any>(null);
  const [perfData, setPerfData] = useState<any>(null);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [feedbackRecent, setFeedbackRecent] = useState<any[]>([]);
  const traceEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.agents().then(setAgents);
    api.agentTools().then((d) => d.ok && setTools(d.tools));
  }, []);

  useEffect(() => {
    if (tab === "errors") {
      const refresh = () => {
        api.n8nErrors().then(setErrorsData);
        api.n8nErrorTimeline().then(setTimelineData);
      };
      refresh();
      const i = setInterval(refresh, 30000);
      return () => clearInterval(i);
    }
    if (tab === "metrics") {
      const refresh = () => api.agentPerformance().then(setPerfData);
      refresh();
      const i = setInterval(refresh, 60000);
      return () => clearInterval(i);
    }
    if (tab === "feedback") {
      const refresh = () => {
        api.feedbackInsights().then(setFeedbackData);
        api.feedbackRecent(20).then((r) => r.ok && setFeedbackRecent(r.entries));
      };
      refresh();
      const i = setInterval(refresh, 60000);
      return () => clearInterval(i);
    }
  }, [tab]);

  useEffect(() => {
    if (showHistory) api.agentSessions().then((d) => d.ok && setHistory(d.sessions));
  }, [showHistory]);

  useEffect(() => {
    traceEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [session?.trace?.length]);

  async function runGoal() {
    if (!goal.trim() || running) return;
    setRunning(true);
    setSession(null);
    const r = await api.agentRun(goal.trim());
    setSession(r);
    setRunning(false);
  }

  async function decide(action: "approve_once" | "approve_always" | "deny") {
    if (!session?.id || running) return;
    setRunning(true);
    const r = await api.agentApprove(session.id, action);
    setSession(r);
    setRunning(false);
  }

  async function loadSession(id: string) {
    setRunning(true);
    const r = await api.agentSessionDetail(id);
    if (r.ok) {
      const s = r.session;
      setSession({
        ok: true, id: s.id, status: s.status, iterations: s.iterations,
        trace: s.trace, final_answer: s.final_answer,
        pending_approval: s.pending_approval, error: s.error,
      });
      setGoal(s.goal);
    }
    setRunning(false);
    setShowHistory(false);
  }

  return (
    <div className="p-5 space-y-4">
      <PageHeader
        title="Tony Autónomo · Agentes IA"
        subtitle="ACCESO TOTAL · TOOLS DE SHELL/FS/WEB/N8N · APPROVAL EN TIEMPO REAL"
        action={
          <div className="flex gap-1">
            <button
              onClick={() => setTab("agent")}
              className={`px-3 py-1.5 rounded text-[10px] font-mono tracking-widest border ${
                tab === "agent"
                  ? "border-[var(--color-cyan)] text-[var(--color-cyan)] bg-[var(--color-cyan)]/10"
                  : "border-[var(--color-border)] text-[var(--color-text-dim)]"
              }`}
            >
              <Bot size={12} className="inline mr-1" />TONY
            </button>
            <button
              onClick={() => setTab("specialized")}
              className={`px-3 py-1.5 rounded text-[10px] font-mono tracking-widest border ${
                tab === "specialized"
                  ? "border-[var(--color-cyan)] text-[var(--color-cyan)] bg-[var(--color-cyan)]/10"
                  : "border-[var(--color-border)] text-[var(--color-text-dim)]"
              }`}
            >
              <Brain size={12} className="inline mr-1" />ESPECIALIZADOS
            </button>
            <button
              onClick={() => setTab("errors")}
              className={`px-3 py-1.5 rounded text-[10px] font-mono tracking-widest border ${
                tab === "errors"
                  ? "border-[var(--color-red)] text-[var(--color-red)] bg-[var(--color-red)]/10"
                  : "border-[var(--color-border)] text-[var(--color-text-dim)]"
              }`}
            >
              <AlertTriangle size={12} className="inline mr-1" />ERRORES
              {errorsData?.total_errors_last_30 > 0 && (
                <span className="ml-1 px-1.5 rounded-full bg-[var(--color-red)] text-black text-[8px]">
                  {errorsData.total_errors_last_30}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("metrics")}
              className={`px-3 py-1.5 rounded text-[10px] font-mono tracking-widest border ${
                tab === "metrics"
                  ? "border-[var(--color-cyan)] text-[var(--color-cyan)] bg-[var(--color-cyan)]/10"
                  : "border-[var(--color-border)] text-[var(--color-text-dim)]"
              }`}
            >
              <Activity size={12} className="inline mr-1" />MÉTRICAS
            </button>
            <button
              onClick={() => setTab("feedback")}
              className={`px-3 py-1.5 rounded text-[10px] font-mono tracking-widest border ${
                tab === "feedback"
                  ? "border-purple-400 text-purple-400 bg-purple-400/10"
                  : "border-[var(--color-border)] text-[var(--color-text-dim)]"
              }`}
            >
              <Eye size={12} className="inline mr-1" />FEEDBACK
            </button>
          </div>
        }
      />

      {tab === "agent" && (
        <>
          {/* Tony explica — quick status summary */}
          <ExplicaPanel />

          {/* Goal input */}
          <Card glow="cyan" scanline>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-[var(--color-cyan)] bg-[var(--color-cyan)]/10 flex items-center justify-center shrink-0 glow-cyan">
                <Bot size={18} className="text-[var(--color-cyan)]" />
              </div>
              <div className="flex-1 space-y-2">
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runGoal(); }
                  }}
                  placeholder="Pídele a Tony que haga lo que sea — leer archivos, buscar en código, fetch web, ejecutar shell, disparar workflows..."
                  rows={2}
                  className="w-full px-3 py-2 bg-black/60 border border-[var(--color-border)] rounded text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-cyan)] resize-none"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-1 flex-wrap">
                    {EXAMPLE_GOALS.slice(0, 3).map((eg) => (
                      <button
                        key={eg}
                        onClick={() => setGoal(eg)}
                        className="text-[9px] font-mono px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-cyan)] hover:border-[var(--color-cyan)]/50 transition-colors"
                      >
                        {eg.length > 50 ? eg.substring(0, 47) + "..." : eg}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="px-3 py-1.5 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-cyan)] flex items-center gap-1.5"
                    >
                      <History size={12} />
                      <span className="text-[10px] font-mono tracking-widest">HISTORIAL</span>
                    </button>
                    <button
                      onClick={runGoal}
                      disabled={!goal.trim() || running}
                      className="px-4 py-1.5 rounded bg-[var(--color-cyan)]/20 border border-[var(--color-cyan)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/40 disabled:opacity-40 flex items-center gap-2 transition-colors"
                    >
                      {running ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      <span className="text-[10px] font-mono tracking-widest">
                        {running ? "EJECUTANDO..." : "EJECUTAR"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* History panel */}
          {showHistory && (
            <Card title="Sesiones recientes" className="">
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {history.length === 0 && (
                  <div className="text-[10px] text-[var(--color-text-dim)] font-mono text-center py-4">
                    Sin sesiones aún
                  </div>
                )}
                {history.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadSession(s.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 text-left"
                  >
                    <StatusBadge status={s.status} />
                    <span className="text-[11px] text-[var(--color-text)] font-mono flex-1 truncate">{s.goal}</span>
                    <span className="text-[9px] text-[var(--color-text-dim)] font-mono">
                      {s.iterations} iter
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Session execution view */}
          {session && (
            <Card
              glow={session.status === "complete" ? "green" : "cyan"}
              title={`Sesión ${session.id} · ${session.iterations} iteración${session.iterations !== 1 ? "es" : ""}`}
            >
              {/* Status banner */}
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                <StatusBadge status={session.status} />
                {(session as any).memory_used && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono tracking-widest px-2 py-0.5 rounded border border-purple-400/40 text-purple-400 bg-purple-400/10">
                    <Brain size={10} />
                    MEMORIA · {(session as any).memory_meta?.match_count || 0} matches
                  </span>
                )}
                {session.error && (
                  <span className="text-[10px] font-mono text-[var(--color-red)] truncate">{session.error.substring(0, 200)}</span>
                )}
              </div>

              {/* Trace */}
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {session.trace.map((t, i) => (
                  <TraceEntry key={i} entry={t} />
                ))}
                <div ref={traceEndRef} />
              </div>

              {/* Pending approval UI */}
              {session.status === "needs_approval" && session.pending_approval && (
                <div className="mt-4 p-4 rounded border-2 border-[var(--color-amber)] bg-[var(--color-amber)]/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={18} className="text-[var(--color-amber)]" />
                    <span className="text-sm font-bold text-[var(--color-amber)]">Tony solicita aprobación</span>
                  </div>
                  <div className="text-[11px] text-[var(--color-text)]">
                    <div className="font-mono mb-1">
                      <span className="text-[var(--color-text-dim)]">tool:</span> {session.pending_approval.tool}
                    </div>
                    <div className="font-mono text-[var(--color-text-dim)] mb-1">{session.pending_approval.description}</div>
                    <pre className="bg-black/60 border border-[var(--color-border)] rounded p-2 text-[10px] overflow-x-auto whitespace-pre-wrap break-all">
{JSON.stringify(session.pending_approval.args, null, 2)}
                    </pre>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => decide("approve_once")}
                      disabled={running}
                      className="px-3 py-2 rounded bg-[var(--color-green)]/20 border border-[var(--color-green)] text-[var(--color-green)] hover:bg-[var(--color-green)]/40 disabled:opacity-40 text-[10px] font-mono tracking-widest flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={12} />APROBAR UNA VEZ
                    </button>
                    <button
                      onClick={() => decide("approve_always")}
                      disabled={running}
                      className="px-3 py-2 rounded bg-[var(--color-cyan)]/20 border border-[var(--color-cyan)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/40 disabled:opacity-40 text-[10px] font-mono tracking-widest flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={12} />APROBAR ESTA SESIÓN
                    </button>
                    <button
                      onClick={() => decide("deny")}
                      disabled={running}
                      className="px-3 py-2 rounded bg-[var(--color-red)]/20 border border-[var(--color-red)] text-[var(--color-red)] hover:bg-[var(--color-red)]/40 disabled:opacity-40 text-[10px] font-mono tracking-widest flex items-center gap-1.5"
                    >
                      <XCircle size={12} />RECHAZAR
                    </button>
                  </div>
                </div>
              )}

              {/* Final answer */}
              {session.final_answer && session.status === "complete" && (
                <div className="mt-4 p-4 rounded border border-[var(--color-green)] bg-[var(--color-green)]/5">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={14} className="text-[var(--color-green)]" />
                    <span className="text-[10px] font-mono tracking-widest text-[var(--color-green)]">RESPUESTA FINAL</span>
                  </div>
                  <div className="text-sm text-[var(--color-text)] whitespace-pre-wrap">{session.final_answer}</div>
                </div>
              )}
            </Card>
          )}

          {/* Available tools panel */}
          <Card title={`Herramientas disponibles · ${tools.length} tools`}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {tools.map((t) => {
                const Icon = TOOL_ICONS[t.name] || Wrench;
                return (
                  <div
                    key={t.name}
                    className={`px-2 py-1.5 rounded border text-[10px] font-mono ${
                      t.requires_approval
                        ? "border-[var(--color-amber)]/40 text-[var(--color-amber)] bg-[var(--color-amber)]/5"
                        : "border-[var(--color-border)] text-[var(--color-text-dim)]"
                    }`}
                    title={t.description}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon size={10} />
                      <span className="truncate">{t.name}</span>
                      {t.requires_approval && <ShieldAlert size={10} className="ml-auto" />}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-[9px] text-[var(--color-text-dim)] font-mono flex items-center gap-3">
              <span><ShieldAlert size={9} className="inline text-[var(--color-amber)]" /> requiere aprobación</span>
              <span>resto = read-only auto-ejecutado</span>
            </div>
          </Card>
        </>
      )}

      {tab === "specialized" && (
        <>
          <SpecialistAgentsEditor agentsApi={agents} />


          <Card title="PROVEEDORES LLM · ACTIVOS">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                <div className="text-[10px] tracking-widest text-[var(--color-cyan)]">GROQ · PRINCIPAL</div>
                <div className="text-[11px] text-[var(--color-text)] font-mono mt-1">llama-3.3-70b-versatile</div>
                <div className="text-[9px] text-[var(--color-text-dim)] font-mono">cascada al 8b si rate-limit</div>
              </div>
              <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                <div className="text-[10px] tracking-widest text-[var(--color-green)]">OLLAMA · RESPALDO LOCAL</div>
                <div className="text-[11px] text-[var(--color-text)] font-mono mt-1">llama3.2:3b</div>
                <div className="text-[9px] text-[var(--color-text-dim)] font-mono">CPU 1.9GB · 30-90s</div>
              </div>
              <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                <div className="text-[10px] tracking-widest text-purple-400">ANTHROPIC · A DEMANDA</div>
                <div className="text-[11px] text-[var(--color-text)] font-mono mt-1">claude-sonnet-4-6</div>
                <div className="text-[9px] text-[var(--color-text-dim)] font-mono">visión + thinking 5k</div>
              </div>
            </div>
          </Card>
        </>
      )}

      {tab === "feedback" && (
        <Card title="Telegram Replies · Feedback aprendido">
          {!feedbackData ? (
            <div className="flex items-center gap-2 py-4 text-[var(--color-text-dim)]">
              <Loader2 size={14} className="animate-spin" /><span className="text-[10px] font-mono">cargando...</span>
            </div>
          ) : feedbackData.total === 0 ? (
            <div className="text-center py-8 text-[11px] text-[var(--color-text-dim)] font-mono">
              <Eye size={32} className="mx-auto mb-3 opacity-40" />
              Sin feedback capturado todavía.<br />
              <span className="text-[10px]">
                Cuando respondas a un mensaje del bot en Telegram, Tony lo captura aquí
                y aprende de tu intent.
              </span>
            </div>
          ) : (
            <>
              {/* KPI tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                  <div className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">TOTAL FEEDBACKS</div>
                  <div className="text-2xl font-bold text-purple-400">{feedbackData.total}</div>
                </div>
                <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                  <div className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">POSITIVE RATE</div>
                  <div className="text-2xl font-bold text-[var(--color-green)]">{feedbackData.positive_rate_pct}%</div>
                </div>
                <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                  <div className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">REJECTION RATE</div>
                  <div className="text-2xl font-bold text-[var(--color-red)]">{feedbackData.rejection_rate_pct}%</div>
                </div>
                <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                  <div className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">CATEGORÍAS</div>
                  <div className="text-2xl font-bold text-[var(--color-cyan)]">
                    {Object.keys(feedbackData.by_category || {}).length}
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono mb-2">POR CATEGORÍA</div>
                  <div className="space-y-1">
                    {Object.entries(feedbackData.by_category || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[10px] font-mono px-2 py-1 bg-black/40 rounded">
                        <span className="text-[var(--color-text)]">{k}</span>
                        <span className="text-[var(--color-cyan)]">{v as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono mb-2">POR INTENT</div>
                  <div className="space-y-1">
                    {Object.entries(feedbackData.by_intent || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[10px] font-mono px-2 py-1 bg-black/40 rounded">
                        <span className="text-[var(--color-text)]">{k}</span>
                        <span className="text-[var(--color-amber)]">{v as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono mb-2">POR SENTIMENT</div>
                  <div className="space-y-1">
                    {Object.entries(feedbackData.by_sentiment || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[10px] font-mono px-2 py-1 bg-black/40 rounded">
                        <span className="text-[var(--color-text)]">{k}</span>
                        <span className={k === "positive" ? "text-[var(--color-green)]" : k === "negative" ? "text-[var(--color-red)]" : "text-[var(--color-text-dim)]"}>{v as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent entries */}
              <div className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono mb-2">ÚLTIMOS REPLIES</div>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {feedbackRecent.map((e: any, i: number) => (
                  <div key={i} className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-[9px] font-mono">
                        <span className="text-[var(--color-text-dim)]">{e.ts.replace("T", " ").substring(0, 19)}</span>
                        <span className="text-[var(--color-cyan)]">{e.category}</span>
                        <span className="text-[var(--color-amber)]">{e.intent}</span>
                        <span className={
                          e.sentiment === "positive" ? "text-[var(--color-green)]" :
                          e.sentiment === "negative" ? "text-[var(--color-red)]" :
                          "text-[var(--color-text-dim)]"
                        }>{e.sentiment}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-[var(--color-text)]">{e.reply_text}</div>
                    {e.original_preview && (
                      <div className="text-[9px] text-[var(--color-text-dim)] mt-1 italic">
                        ↳ original: {e.original_preview}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {tab === "metrics" && (
        <Card title="Tony Agent Performance · 7d">
          {!perfData ? (
            <div className="flex items-center gap-2 py-4 text-[var(--color-text-dim)]">
              <Loader2 size={14} className="animate-spin" /><span className="text-[10px] font-mono">cargando...</span>
            </div>
          ) : (
            <>
              {/* Top metrics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                  <div className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">SESIONES</div>
                  <div className="text-2xl font-bold text-[var(--color-cyan)]">{perfData.total_sessions}</div>
                </div>
                <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                  <div className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">COMPLETION</div>
                  <div className={`text-2xl font-bold ${perfData.completion_rate_pct >= 70 ? "text-[var(--color-green)]" : perfData.completion_rate_pct >= 40 ? "text-[var(--color-amber)]" : "text-[var(--color-red)]"}`}>
                    {perfData.completion_rate_pct}%
                  </div>
                </div>
                <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                  <div className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">AVG ITER</div>
                  <div className="text-2xl font-bold text-[var(--color-text)]">{perfData.avg_iterations}</div>
                </div>
                <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                  <div className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">MEMORIA USO</div>
                  <div className="text-2xl font-bold text-purple-400">{perfData.memory_usage_pct}%</div>
                </div>
                <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                  <div className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">TOOLS USED</div>
                  <div className="text-2xl font-bold text-[var(--color-amber)]">{perfData.top_tools?.length || 0}</div>
                </div>
              </div>

              {/* Timeline 7d */}
              <div className="mb-4">
                <div className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono mb-2">TIMELINE 7 DÍAS</div>
                <div className="flex items-end gap-1 h-24 px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                  {perfData.timeline_7d.map((d: any) => {
                    const maxT = Math.max(...perfData.timeline_7d.map((x: any) => x.total), 1);
                    const completePct = (d.complete / maxT) * 100;
                    const errorPct = (d.error / maxT) * 100;
                    return (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-0.5" title={`${d.day}: ${d.total} sesiones (${d.complete} ok, ${d.error} err)`}>
                        <div className="w-full flex flex-col-reverse" style={{ height: "100%" }}>
                          <div className="bg-[var(--color-green)]/60 rounded-b" style={{ height: `${completePct}%` }} />
                          <div className="bg-[var(--color-red)]/60" style={{ height: `${errorPct}%` }} />
                        </div>
                        <div className="text-[7px] font-mono text-[var(--color-text-dim)]">{d.day.slice(-5)}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-3 text-[8px] font-mono text-[var(--color-text-dim)] mt-1">
                  <span><span className="inline-block w-2 h-2 bg-[var(--color-green)]/60 rounded mr-1"></span>complete</span>
                  <span><span className="inline-block w-2 h-2 bg-[var(--color-red)]/60 rounded mr-1"></span>error</span>
                </div>
              </div>

              {/* Top tools */}
              <div>
                <div className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono mb-2">TOP TOOLS USADAS</div>
                <div className="space-y-1">
                  {perfData.top_tools?.slice(0, 10).map(([name, count]: [string, number]) => {
                    const max = perfData.top_tools[0][1];
                    const pct = (count / max) * 100;
                    return (
                      <div key={name} className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="w-32 truncate text-[var(--color-text)]">{name}</span>
                        <div className="flex-1 h-3 bg-black/40 rounded overflow-hidden">
                          <div className="h-full bg-[var(--color-cyan)]/60" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 text-right text-[var(--color-text-dim)]">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {tab === "errors" && (
        <>
          <Card title="ERRORES n8n · ÚLTIMOS 30" glow={errorsData?.total_errors_last_30 > 5 ? undefined : "green"}>
            {!errorsData ? (
              <div className="flex items-center gap-2 text-[var(--color-text-dim)] text-[11px] font-mono py-4">
                <Loader2 size={14} className="animate-spin" /> cargando...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                    <div className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">TOTAL ERRORES</div>
                    <div className={`text-2xl font-bold ${errorsData.total_errors_last_30 > 5 ? "text-[var(--color-red)]" : "text-[var(--color-green)]"}`}>
                      {errorsData.total_errors_last_30}
                    </div>
                  </div>
                  <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                    <div className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">WORKFLOWS AFECTADOS</div>
                    <div className="text-2xl font-bold text-[var(--color-amber)]">{errorsData.by_workflow?.length || 0}</div>
                  </div>
                  <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                    <div className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">MÁS RECIENTE</div>
                    <div className="text-[11px] font-mono text-[var(--color-text)] mt-1">
                      {errorsData.errors?.[0]?.started_at?.replace("T", " ").substring(0, 19) || "—"}
                    </div>
                  </div>
                  <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                    <div className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">AUTO-REFRESH</div>
                    <div className="text-[11px] font-mono text-[var(--color-cyan)] mt-1">cada 30s</div>
                  </div>
                </div>

                {/* Timeline 24h */}
                {timelineData?.timeline && (
                  <div className="mb-4">
                    <div className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono mb-2">
                      TIMELINE 24H · {timelineData.total_24h || 0} errores
                    </div>
                    <div className="flex items-end gap-0.5 h-20 px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                      {timelineData.timeline.map((b: any) => {
                        const max = Math.max(...timelineData.timeline.map((x: any) => x.count), 1);
                        const heightPct = (b.count / max) * 100;
                        return (
                          <div
                            key={b.hour}
                            className="flex-1 flex flex-col items-center justify-end gap-1 group relative"
                            title={`${b.label}: ${b.count} errores`}
                          >
                            <div
                              className={`w-full rounded-t transition-colors ${
                                b.count === 0
                                  ? "bg-[var(--color-green)]/20"
                                  : b.count <= 3
                                  ? "bg-[var(--color-amber)]/60"
                                  : "bg-[var(--color-red)]/80"
                              }`}
                              style={{ height: `${Math.max(heightPct, 2)}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-[var(--color-text-dim)] mt-1 px-3">
                      <span>{timelineData.timeline[0]?.label}</span>
                      <span>{timelineData.timeline[Math.floor(timelineData.timeline.length / 2)]?.label}</span>
                      <span>{timelineData.timeline[timelineData.timeline.length - 1]?.label}</span>
                    </div>
                  </div>
                )}

                <div className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono mb-2">POR WORKFLOW</div>
                <div className="space-y-1 mb-4">
                  {errorsData.by_workflow?.map((w: any) => (
                    <div
                      key={w.workflow_name}
                      className="flex items-center justify-between gap-3 px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <AlertTriangle size={12} className="text-[var(--color-red)] shrink-0" />
                        <span className="text-[12px] text-[var(--color-text)] truncate">{w.workflow_name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] font-mono text-[var(--color-text-dim)]">
                          {w.most_recent.replace("T", " ").substring(0, 19)}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[var(--color-red)]/20 border border-[var(--color-red)]/40 text-[var(--color-red)] text-[10px] font-mono">
                          {w.error_count}
                        </span>
                      </div>
                    </div>
                  ))}
                  {errorsData.by_workflow?.length === 0 && (
                    <div className="text-center py-6 text-[11px] font-mono text-[var(--color-green)]">
                      ✓ Sin errores recientes
                    </div>
                  )}
                </div>

                <div className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono mb-2">TIMELINE</div>
                <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                  {errorsData.errors?.slice(0, 15).map((e: any) => (
                    <div key={e.id} className="flex items-center gap-2 text-[10px] font-mono px-2 py-1 hover:bg-white/5 rounded">
                      <XCircle size={10} className="text-[var(--color-red)]" />
                      <span className="text-[var(--color-text-dim)] w-32">{e.started_at.replace("T", " ").substring(0, 19)}</span>
                      <span className="text-[var(--color-text)] truncate">{e.workflow_name}</span>
                      <span className="text-[var(--color-text-dim)] ml-auto shrink-0">{e.mode}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function SpecialistAgentsEditor({ agentsApi }: { agentsApi: any }) {
  const [config, setConfig] = useState<{ agents: AgentConfig[]; _metadata?: any } | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<AgentConfig[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    api.agentsConfig().then((r) => r.ok && setConfig(r.config));
  }, []);

  function startEdit() {
    setDraft(config?.agents ? JSON.parse(JSON.stringify(config.agents)) : []);
    setEditing(true);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    const r = await api.agentsConfigSave({ ...config, agents: draft });
    if (r.ok) {
      setConfig({ ...(config || {}), agents: draft });
      setEditing(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    }
    setSaving(false);
  }

  function cancel() { setEditing(false); setDraft([]); }

  function updateAgent(idx: number, field: keyof AgentConfig, value: any) {
    const next = [...draft];
    (next[idx] as any)[field] = value;
    setDraft(next);
  }

  function addAgent() {
    setDraft([
      ...draft,
      {
        id: `custom_${Date.now()}`,
        name: "NEW_AGENT",
        enabled: true,
        role: "Define el rol aquí",
        accent: "cyan",
        responsibilities: [],
        trigger_keywords: [],
      },
    ]);
  }

  function removeAgent(idx: number) {
    if (!confirm(`Eliminar agente ${draft[idx].name}?`)) return;
    setDraft(draft.filter((_, i) => i !== idx));
  }

  if (!config) {
    return (
      <Card>
        <div className="flex items-center gap-2 py-4 text-[var(--color-text-dim)] text-[11px] font-mono">
          <Loader2 size={14} className="animate-spin" /> cargando agents config...
        </div>
      </Card>
    );
  }

  const agents = editing ? draft : config.agents;
  const enabledCount = agents.filter((a) => a.enabled).length;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 bg-black/40 border border-[var(--color-border)] rounded">
        <div className="text-[10px] font-mono text-[var(--color-text-dim)]">
          {agents.length} agentes definidos · <span className="text-[var(--color-green)]">{enabledCount} activos</span>
          {savedFlash && <span className="ml-2 text-[var(--color-green)]">✓ guardado</span>}
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--color-cyan)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/10"
            >
              <Edit2 size={12} />
              <span className="text-[10px] font-mono tracking-widest">EDITAR</span>
            </button>
          ) : (
            <>
              <button
                onClick={addAgent}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--color-green)] text-[var(--color-green)] hover:bg-[var(--color-green)]/10"
              >
                <PlusIcon size={12} />
                <span className="text-[10px] font-mono tracking-widest">AÑADIR</span>
              </button>
              <button
                onClick={cancel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
              >
                <XIcon size={12} />
                <span className="text-[10px] font-mono tracking-widest">CANCELAR</span>
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--color-green)]/20 border border-[var(--color-green)] text-[var(--color-green)] hover:bg-[var(--color-green)]/40 disabled:opacity-40"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                <span className="text-[10px] font-mono tracking-widest">GUARDAR</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Agents grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((a, idx) => (
          <AgentCard
            key={a.id}
            agent={a}
            editing={editing}
            agentsApi={agentsApi}
            onUpdate={(field, value) => updateAgent(idx, field, value)}
            onRemove={() => removeAgent(idx)}
          />
        ))}
      </div>

      {/* Help (visible only when editing) */}
      {editing && (
        <Card title="📖 GUÍA EDICIÓN">
          <div className="text-[11px] text-[var(--color-text-dim)] space-y-2 font-mono leading-relaxed">
            <div><strong className="text-[var(--color-text)]">enabled</strong>: si está OFF el agente no responde a goals (queda como referencia)</div>
            <div><strong className="text-[var(--color-text)]">trigger_keywords</strong>: palabras que activan el agente (separadas por coma)</div>
            <div><strong className="text-[var(--color-text)]">tools_needed</strong>: tools del catálogo que el agente puede usar</div>
            <div><strong className="text-[var(--color-text)]">accent</strong>: color del card · cyan / green / red / amber / purple</div>
            <div className="text-[var(--color-amber)]">⚠ Cambios aplican al GUARDAR. Backup automático en .json.bak.</div>
          </div>
        </Card>
      )}
    </div>
  );
}

function AgentCard({
  agent, editing, agentsApi, onUpdate, onRemove,
}: {
  agent: AgentConfig;
  editing: boolean;
  agentsApi: any;
  onUpdate: (field: keyof AgentConfig, value: any) => void;
  onRemove: () => void;
}) {
  const accent = agent.accent || "cyan";
  const accentClass = ACCENT[accent] || ACCENT.cyan;
  const linkedActive = (agentsApi?.agents || []).filter((w: any) =>
    (agent.linked_workflows || []).some((needle: string) =>
      w.name.toLowerCase().includes(needle.toLowerCase().split(" ")[0])
    )
  );

  if (editing) {
    return (
      <Card className={`border-2 ${accentClass.split(" ")[0]}`} title={`Editar · ${agent.name}`}>
        <div className="space-y-2 text-[10px] font-mono">
          <label className="block">
            <span className="text-[var(--color-text-dim)]">name</span>
            <input
              value={agent.name}
              onChange={(e) => onUpdate("name", e.target.value)}
              className="w-full mt-0.5 px-2 py-1 bg-black/40 border border-[var(--color-border)] rounded text-[var(--color-text)] focus:outline-none focus:border-[var(--color-cyan)]"
            />
          </label>
          <label className="block">
            <span className="text-[var(--color-text-dim)]">role</span>
            <input
              value={agent.role}
              onChange={(e) => onUpdate("role", e.target.value)}
              className="w-full mt-0.5 px-2 py-1 bg-black/40 border border-[var(--color-border)] rounded text-[var(--color-text)] focus:outline-none focus:border-[var(--color-cyan)]"
            />
          </label>
          <label className="block">
            <span className="text-[var(--color-text-dim)]">accent</span>
            <select
              value={agent.accent}
              onChange={(e) => onUpdate("accent", e.target.value)}
              className="w-full mt-0.5 px-2 py-1 bg-black/40 border border-[var(--color-border)] rounded text-[var(--color-text)]"
            >
              {["cyan", "green", "red", "amber", "purple"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[var(--color-text-dim)]">trigger_keywords (coma separated)</span>
            <input
              value={(agent.trigger_keywords || []).join(", ")}
              onChange={(e) => onUpdate("trigger_keywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              className="w-full mt-0.5 px-2 py-1 bg-black/40 border border-[var(--color-border)] rounded text-[var(--color-text)]"
            />
          </label>
          <label className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              checked={agent.enabled}
              onChange={(e) => onUpdate("enabled", e.target.checked)}
              className="accent-[var(--color-green)]"
            />
            <span className="text-[var(--color-text-dim)]">habilitado</span>
          </label>
          <button
            onClick={onRemove}
            className="w-full mt-2 flex items-center justify-center gap-1 px-2 py-1 rounded border border-[var(--color-red)]/40 text-[var(--color-red)] hover:bg-[var(--color-red)]/10"
          >
            <Trash2 size={10} />
            <span className="text-[9px] tracking-widest">ELIMINAR</span>
          </button>
        </div>
      </Card>
    );
  }

  // Read-only view
  return (
    <Card className={`border-2 ${accentClass.split(" ")[0]} ${!agent.enabled ? "opacity-50" : ""}`} title={agent.name}>
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full border-2 ${accentClass} mb-3`}>
        <Brain size={24} strokeWidth={1.5} />
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm text-[var(--color-text)] font-semibold">{agent.role}</span>
        {!agent.enabled && (
          <span className="text-[8px] tracking-widest font-mono px-1.5 py-0.5 rounded border border-[var(--color-text-dim)]/30 text-[var(--color-text-dim)]">
            OFF
          </span>
        )}
      </div>
      <div className="text-[10px] text-[var(--color-text-dim)] font-mono mb-3">
        {linkedActive.length} flujo{linkedActive.length !== 1 ? "s" : ""} activo{linkedActive.length !== 1 ? "s" : ""}
      </div>
      {agent.trigger_keywords && agent.trigger_keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {agent.trigger_keywords.slice(0, 5).map((k) => (
            <span key={k} className="text-[8px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-black/40 border border-[var(--color-border)] text-[var(--color-text-dim)]">
              {k}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-1">
        {linkedActive.slice(0, 3).map((w: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-[10px] text-[var(--color-text-dim)] font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-green)] animate-pulse" />
            {w.name}
          </div>
        ))}
        {linkedActive.length === 0 && (
          <div className="text-[10px] text-[var(--color-text-dim)]">Sin coincidencias en flujos</div>
        )}
      </div>
    </Card>
  );
}

function ExplicaPanel() {
  const [data, setData] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    api.tonyExplica().then(setData);
    const i = setInterval(() => api.tonyExplica().then(setData), 60000);
    return () => clearInterval(i);
  }, []);

  if (!data?.ok) return null;
  const score = data.score || 0;
  const colorBorder =
    score >= 80 ? "border-[var(--color-green)]/40" :
    score >= 60 ? "border-[var(--color-amber)]/40" :
    "border-[var(--color-red)]/40";
  const colorBg =
    score >= 80 ? "bg-[var(--color-green)]/5" :
    score >= 60 ? "bg-[var(--color-amber)]/5" :
    "bg-[var(--color-red)]/5";

  // Just show first line (mood) + button to expand
  const lines = (data.explanation || "").split("\n");
  const mood = lines[0]?.replace(/^#\s*/, "") || data.mood;
  const detail = lines.slice(1).filter((l: string) => l.trim()).join("\n");

  return (
    <div className={`px-3 py-2.5 rounded border ${colorBorder} ${colorBg} flex items-start gap-3`}>
      <Sparkles size={14} className={`mt-0.5 shrink-0 ${score >= 80 ? "text-[var(--color-green)]" : score >= 60 ? "text-[var(--color-amber)]" : "text-[var(--color-red)]"}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[12px] text-[var(--color-text)] font-semibold truncate">{mood}</div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[9px] font-mono tracking-widest text-[var(--color-text-dim)] hover:text-[var(--color-cyan)] shrink-0"
          >
            {expanded ? "OCULTAR" : "DETALLE"}
          </button>
        </div>
        {expanded && (
          <pre className="text-[10px] font-mono text-[var(--color-text-dim)] whitespace-pre-wrap mt-2 leading-relaxed">{detail}</pre>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: typeof Activity; label: string }> = {
    running: { color: "cyan", icon: Loader2, label: "EJECUTANDO" },
    complete: { color: "green", icon: CheckCircle2, label: "COMPLETADO" },
    needs_approval: { color: "amber", icon: Pause, label: "APROBACIÓN" },
    error: { color: "red", icon: XCircle, label: "ERROR" },
    max_iterations: { color: "amber", icon: AlertTriangle, label: "MAX ITER" },
  };
  const s = map[status] || { color: "cyan", icon: Activity, label: status.toUpperCase() };
  const Icon = s.icon;
  const colorClass: Record<string, string> = {
    cyan: "border-[var(--color-cyan)]/40 text-[var(--color-cyan)] bg-[var(--color-cyan)]/10",
    green: "border-[var(--color-green)]/40 text-[var(--color-green)] bg-[var(--color-green)]/10",
    amber: "border-[var(--color-amber)]/40 text-[var(--color-amber)] bg-[var(--color-amber)]/10",
    red: "border-[var(--color-red)]/40 text-[var(--color-red)] bg-[var(--color-red)]/10",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-mono tracking-widest px-2 py-0.5 rounded border ${colorClass[s.color]}`}>
      <Icon size={10} className={status === "running" ? "animate-spin" : ""} />
      {s.label}
    </span>
  );
}

function TraceEntry({ entry }: { entry: AgentTraceEntry }) {
  if (entry.type === "assistant") {
    const tcs = entry.tool_calls || [];
    return (
      <div className="flex gap-2">
        <Bot size={14} className="text-[var(--color-cyan)] mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-mono text-[var(--color-text-dim)] mb-0.5">
            iter {entry.iteration} · {entry.model}
          </div>
          {entry.content && (
            <div className="text-[12px] text-[var(--color-text)] whitespace-pre-wrap mb-1">{entry.content}</div>
          )}
          {tcs.length > 0 && (
            <div className="space-y-1">
              {tcs.map((tc, i) => {
                const Icon = TOOL_ICONS[tc.function.name] || Wrench;
                return (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] font-mono">
                    <ChevronRight size={10} className="text-[var(--color-cyan)]" />
                    <Icon size={10} className="text-[var(--color-cyan)]" />
                    <span className="text-[var(--color-cyan)]">{tc.function.name}</span>
                    <span className="text-[var(--color-text-dim)] truncate">({tc.function.arguments.substring(0, 100)})</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
  if (entry.type === "tool_result") {
    const Icon = TOOL_ICONS[entry.tool] || Wrench;
    return (
      <div className="flex gap-2 ml-6 pl-2 border-l-2 border-[var(--color-border)]">
        <Icon size={12} className={entry.ok ? "text-[var(--color-green)] mt-0.5 shrink-0" : "text-[var(--color-red)] mt-0.5 shrink-0"} />
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-mono text-[var(--color-text-dim)]">
            {entry.tool} {entry.full_count != null && `· ${entry.full_count} items`}
            {entry.ok ? "" : " · ERROR"}
          </div>
          <div className="text-[10px] font-mono text-[var(--color-text-dim)] truncate">
            {entry.preview.substring(0, 200)}{entry.preview.length > 200 ? "..." : ""}
          </div>
        </div>
      </div>
    );
  }
  if (entry.type === "approval_pause") {
    return (
      <div className="flex gap-2 px-3 py-2 bg-[var(--color-amber)]/5 border-l-2 border-[var(--color-amber)] rounded">
        <ShieldAlert size={12} className="text-[var(--color-amber)] mt-0.5 shrink-0" />
        <div className="text-[10px] font-mono text-[var(--color-amber)]">
          Pausa para aprobación de <span className="font-bold">{entry.pending.tool}</span>
        </div>
      </div>
    );
  }
  if (entry.type === "approval") {
    return (
      <div className="flex gap-2 ml-6 pl-2 border-l-2 border-[var(--color-cyan)]/40">
        <CheckCircle2 size={12} className="text-[var(--color-green)] mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-mono text-[var(--color-text-dim)]">
            aprobación · {entry.tool} · {entry.decision}
          </div>
          {entry.preview && (
            <div className="text-[10px] font-mono text-[var(--color-text-dim)] truncate">{entry.preview.substring(0, 200)}</div>
          )}
        </div>
      </div>
    );
  }
  if (entry.type === "llm_error") {
    return (
      <div className="flex gap-2 px-3 py-2 bg-[var(--color-red)]/5 border-l-2 border-[var(--color-red)] rounded">
        <XCircle size={12} className="text-[var(--color-red)] mt-0.5 shrink-0" />
        <div className="text-[10px] font-mono text-[var(--color-red)] flex-1 truncate">{entry.error.substring(0, 300)}</div>
      </div>
    );
  }
  return null;
}
