"use client";
import { useEffect, useRef, useState } from "react";
import { api, type AgentSessionResponse, type AgentTraceEntry } from "@/lib/api";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import {
  Activity, AlertTriangle, Eye, Newspaper, Brain, Zap, Play, Send,
  Loader2, CheckCircle2, XCircle, ShieldAlert, Wrench, FileText,
  Globe, Terminal, Sparkles, Pause, ChevronRight, Bot, History
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
  const [tab, setTab] = useState<"agent" | "specialized">("agent");
  const [tools, setTools] = useState<any[]>([]);
  const [goal, setGoal] = useState("");
  const [session, setSession] = useState<AgentSessionResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const traceEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.agents().then(setAgents);
    api.agentTools().then((d) => d.ok && setTools(d.tools));
  }, []);

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
          </div>
        }
      />

      {tab === "agent" && (
        <>
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
              <div className="mb-3 flex items-center gap-2">
                <StatusBadge status={session.status} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SPEC_AGENTS.map((a) => {
              const Icon = a.icon;
              const linkedActive = (agents.agents || []).filter((w: any) =>
                a.workflows.some((needle) => w.name.toLowerCase().includes(needle.toLowerCase().split(" ")[0]))
              );
              return (
                <Card key={a.id} className={`border-2 ${ACCENT[a.accent].split(" ")[0]}`} title={a.name}>
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full border-2 ${ACCENT[a.accent]} mb-3`}>
                    <Icon size={24} strokeWidth={1.5} />
                  </div>
                  <div className="text-sm text-[var(--color-text)] font-semibold mb-1">{a.role}</div>
                  <div className="text-[10px] text-[var(--color-text-dim)] font-mono mb-3">
                    {linkedActive.length} flujo{linkedActive.length !== 1 ? "s" : ""} activo{linkedActive.length !== 1 ? "s" : ""}
                  </div>
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
            })}
          </div>

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
