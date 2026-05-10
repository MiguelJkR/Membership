"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, MiniMetric } from "@/components/Card";
import { X, CheckCircle2, AlertCircle, Loader2, Clock, Webhook, Zap, GitBranch } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  trading: "bg-[var(--color-cyan)]/20 text-[var(--color-cyan)] border-[var(--color-cyan)]/40",
  ml_bot: "bg-[var(--color-green)]/20 text-[var(--color-green)] border-[var(--color-green)]/40",
  brain: "bg-purple-400/20 text-purple-400 border-purple-400/40",
  ops: "bg-orange-300/20 text-orange-300 border-orange-300/40",
  content: "bg-pink-400/20 text-pink-400 border-pink-400/40",
  default: "bg-[var(--color-text-dim)]/20 text-[var(--color-text-dim)] border-[var(--color-text-dim)]/40",
};

export default function WorkflowsPage() {
  const [agents, setAgents] = useState<any>({});
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [activeWf, setActiveWf] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.agents().then(setAgents);
    const i = setInterval(() => api.agents().then(setAgents), 60000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (!activeWf) { setDetail(null); return; }
    setLoading(true);
    api.workflowDetail(activeWf).then((r) => { setDetail(r); setLoading(false); });
  }, [activeWf]);

  const list = agents.agents || [];
  const categories = ["all", ...Array.from(new Set(list.map((a: any) => a.category)))] as string[];
  const filtered = list.filter((a: any) => {
    if (filter !== "all" && a.category !== filter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Aggregate stats
  const totalActive = list.filter((a: any) => a.active).length;
  const byCategory: Record<string, number> = {};
  list.forEach((a: any) => { byCategory[a.category] = (byCategory[a.category] || 0) + 1; });

  return (
    <div className="p-4 md:p-5 space-y-4">
      {/* Subheader strip — Claude Design vocabulary */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/60 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <GitBranch size={14} className="text-[var(--color-green)]" />
            <span className="text-[10px] tracking-[0.3em] font-mono text-[var(--color-text-dim)]">
              ORQUESTACIÓN N8N · {agents.count || 0} ACTIVOS · CRON + WEBHOOK + EVENTOS · CLICK PARA DETALLE
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <MiniMetric label="TOTAL" value={`${list.length}`} tone="cyan" />
        <MiniMetric label="ACTIVOS" value={`${totalActive}`} tone="green" />
        {Object.entries(byCategory).slice(0, 4).map(([cat, n]) => (
          <MiniMetric key={cat} label={cat.toUpperCase()} value={`${n}`} />
        ))}
      </div>

      {/* Filter pills + search */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((c: string) => {
          const count = c === "all" ? list.length : list.filter((a: any) => a.category === c).length;
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded text-[10px] tracking-widest font-mono border transition-colors ${
                filter === c
                  ? "border-[var(--color-cyan)] text-[var(--color-cyan)] bg-[var(--color-cyan)]/10"
                  : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
              }`}
            >
              {c.toUpperCase()} <span className="opacity-60 ml-1">{count}</span>
            </button>
          );
        })}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar flujo..."
          className="ml-auto px-3 py-1.5 bg-black/40 border border-[var(--color-border)] rounded text-[10px] font-mono text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-cyan)] w-48"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: workflows list */}
        <div className={`${activeWf ? "lg:col-span-5" : "lg:col-span-12"}`}>
          <Card title={`${filtered.length} flujo${filtered.length !== 1 ? "s" : ""}`}>
            <div className={`grid gap-2 max-h-[70vh] overflow-y-auto ${activeWf ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
              {filtered.map((w: any, i: number) => {
                const colors = CATEGORY_COLORS[w.category] || CATEGORY_COLORS.default;
                const isActive = w.id === activeWf;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveWf(w.id === activeWf ? null : w.id)}
                    className={`text-left px-3 py-2 rounded border transition-colors ${
                      isActive
                        ? "border-[var(--color-cyan)] bg-[var(--color-cyan)]/10 glow-cyan"
                        : "border-[var(--color-border)] bg-black/30 hover:border-[var(--color-border-bright)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] text-[var(--color-text)] truncate">{w.name}</span>
                      <span className={`shrink-0 text-[8px] tracking-widest px-2 py-0.5 rounded border font-mono ${colors}`}>
                        {w.category?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${w.active ? "bg-[var(--color-green)] animate-pulse" : "bg-[var(--color-text-dim)]"}`} />
                      <span className="text-[9px] text-[var(--color-text-dim)] font-mono">
                        {w.active ? "ACTIVO" : "INACTIVO"} · ID {w.id}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right: detail panel */}
        {activeWf && (
          <div className="lg:col-span-7">
            <Card
              title={detail?.name || "DETALLE DEL FLUJO"}
              glow="cyan"
              action={
                <button onClick={() => setActiveWf(null)} className="text-[var(--color-text-dim)] hover:text-[var(--color-red)]">
                  <X size={14} />
                </button>
              }
            >
              {loading ? (
                <div className="flex items-center gap-2 text-[var(--color-text-dim)] text-[11px] py-8">
                  <Loader2 size={14} className="animate-spin" />Cargando detalle...
                </div>
              ) : detail?.ok ? (
                <div className="space-y-3">
                  {/* Top metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <MiniMetric label="ESTADO" value={detail.active ? "ACTIVO" : "INACTIVO"} tone={detail.active ? "green" : "red"} />
                    <MiniMetric label="NODOS" value={`${detail.nodes_count}`} tone="cyan" />
                    <MiniMetric label="ÉXITOS 20" value={`${detail.executions_recent_20?.success || 0}`} tone="green" />
                    <MiniMetric label="ERRORES 20" value={`${detail.executions_recent_20?.error || 0}`} tone={detail.executions_recent_20?.error > 0 ? "red" : "green"} />
                  </div>

                  {/* Triggers */}
                  <div>
                    <div className="text-[10px] tracking-widest text-[var(--color-cyan)] font-mono mb-2">DISPARADORES · {detail.triggers?.length || 0}</div>
                    <div className="flex flex-col gap-1.5">
                      {(detail.triggers || []).map((t: any, i: number) => (
                        <div key={i} className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)] flex items-start gap-2">
                          {t.type === "scheduleTrigger" ? <Clock size={14} className="text-[var(--color-amber)] shrink-0 mt-0.5" /> :
                           t.type === "webhook" ? <Webhook size={14} className="text-[var(--color-green)] shrink-0 mt-0.5" /> :
                           <Zap size={14} className="text-[var(--color-cyan)] shrink-0 mt-0.5" />}
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] text-[var(--color-text)] font-semibold">{t.name}</div>
                            <div className="text-[9px] text-[var(--color-text-dim)] font-mono">{t.type}</div>
                            {t.params && Object.entries(t.params).map(([k, v]) => (
                              <div key={k} className="text-[9px] text-[var(--color-text-dim)] font-mono">
                                <span className="text-[var(--color-cyan)]">{k}:</span> {JSON.stringify(v).substring(0, 80)}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Node types */}
                  <div>
                    <div className="text-[10px] tracking-widest text-[var(--color-cyan)] font-mono mb-2">TIPOS DE NODOS · {detail.node_types?.length || 0}</div>
                    <div className="flex flex-wrap gap-1">
                      {(detail.node_types || []).map((nt: string) => (
                        <span key={nt} className="text-[9px] px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] font-mono">
                          {nt}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Last error */}
                  {detail.last_error && (
                    <div className="px-3 py-2 bg-[var(--color-red)]/5 border-l-2 border-[var(--color-red)] rounded">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={12} className="text-[var(--color-red)]" />
                        <span className="text-[10px] tracking-widest text-[var(--color-red)] font-mono">ÚLTIMO ERROR</span>
                      </div>
                      <div className="text-[10px] text-[var(--color-text-dim)] mt-1 font-mono">{detail.last_error}</div>
                    </div>
                  )}

                  {/* Success rate visual */}
                  {(detail.executions_recent_20?.success > 0 || detail.executions_recent_20?.error > 0) && (
                    <div>
                      <div className="text-[10px] tracking-widest text-[var(--color-cyan)] font-mono mb-1">TASA DE ÉXITO · últimas 20</div>
                      <div className="flex h-2 rounded overflow-hidden border border-[var(--color-border)]">
                        <div className="bg-[var(--color-green)]" style={{ width: `${(detail.executions_recent_20.success / 20) * 100}%` }} />
                        <div className="bg-[var(--color-red)]" style={{ width: `${(detail.executions_recent_20.error / 20) * 100}%` }} />
                      </div>
                      <div className="flex justify-between text-[9px] font-mono mt-1">
                        <span className="text-[var(--color-green)]">✓ {detail.executions_recent_20.success}</span>
                        <span className="text-[var(--color-red)]">✗ {detail.executions_recent_20.error}</span>
                      </div>
                    </div>
                  )}

                  {!detail.last_error && detail.executions_recent_20?.success > 0 && (
                    <div className="flex items-center gap-2 text-[var(--color-green)] text-[10px] font-mono">
                      <CheckCircle2 size={12} />Saludable · últimas 20 ejecuciones sin errores
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[10px] text-[var(--color-red)] py-4">Error: {detail?.error || "sin detalle disponible"}</div>
              )}
            </Card>
          </div>
        )}
      </div>

      <Card title="PIPELINE TÍPICO DE FLUJO" glow="cyan">
        <div className="overflow-x-auto">
          <div className="flex items-center gap-3 min-w-max py-4">
            {["DISPARADOR\nWEBHOOK", "OBTENER\nDATOS", "ANÁLISIS\nIA", "FILTRO\nRIESGO", "EJECUCIÓN", "NOTIFICAR\nTELEGRAM"].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-24 h-20 flex items-center justify-center text-center px-3 py-2 rounded-lg border-2 border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/5 text-[10px] tracking-widest text-[var(--color-cyan)] font-mono whitespace-pre-line">
                  {step}
                </div>
                {i < 5 && <div className="text-[var(--color-cyan)]/60 text-2xl">→</div>}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
