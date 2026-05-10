"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Activity, Loader2, DollarSign, Zap, Brain, Cpu, AlertTriangle,
  TrendingUp, MoreVertical,
} from "lucide-react";

const MOOD_META: Record<string, { color: string; bg: string; emoji: string; description: string }> = {
  FRESH: { color: "text-[var(--color-green)]", bg: "border-[var(--color-green)]/40 bg-[var(--color-green)]/10", emoji: "⚡", description: "Free tier dominante" },
  OK: { color: "text-[var(--color-green)]", bg: "border-[var(--color-green)]/40 bg-[var(--color-green)]/10", emoji: "✓", description: "Cascade balanceada" },
  MIXED: { color: "text-[var(--color-amber)]", bg: "border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10", emoji: "◐", description: "Groq + Claude mix" },
  RUSHED: { color: "text-[var(--color-amber)]", bg: "border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10", emoji: "⚠", description: "Gastando en Claude" },
  DEGRADED: { color: "text-[var(--color-red)]", bg: "border-[var(--color-red)]/40 bg-[var(--color-red)]/10", emoji: "✗", description: "Errores excesivos" },
  IDLE: { color: "text-[var(--color-text-dim)]", bg: "border-[var(--color-text-dim)]/30 bg-black/30", emoji: "○", description: "Sin actividad" },
};

/** LLM MOOD INDICATOR — health/cost/usage of the cascade */
export function LLMMoodWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await api.llmMetrics();
        if (!cancelled && r.ok) setData(r);
      } catch {}
      if (!cancelled) setLoading(false);
    };
    load();
    const i = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(i); };
  }, []);

  if (loading || !data) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur p-5 h-full flex items-center justify-center">
        <Loader2 size={14} className="animate-spin text-[var(--color-text-dim)]" />
      </div>
    );
  }

  const meta = MOOD_META[data.mood] || MOOD_META.OK;
  const t = data.totals;
  const shares = data.shares_7d;
  const budgetWarn = t.budget_used_pct >= 80;
  const budgetCritical = t.budget_used_pct >= 95;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] tracking-[0.25em] font-mono text-[var(--color-text)] font-semibold flex items-center gap-2">
          <Activity size={12} className="text-[var(--color-amber)]" />
          LLM MOOD · COSTOS
        </h3>
        <button className="text-[var(--color-text-dim)] hover:text-[var(--color-amber)]">
          <MoreVertical size={14} />
        </button>
      </div>

      {/* Mood card big */}
      <div className={`rounded border ${meta.bg} px-3 py-3 mb-3`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${meta.bg} border flex items-center justify-center text-lg shrink-0`}>
            <span className={meta.color}>{meta.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[8px] tracking-[0.3em] font-mono text-[var(--color-text-dim)]">ESTADO</div>
            <div className={`text-base font-bold tracking-wide ${meta.color}`}>{data.mood}</div>
            <div className="text-[10px] font-mono text-[var(--color-text-dim)]">
              {data.mood_label}
            </div>
          </div>
        </div>
      </div>

      {/* Cost row */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded border border-[var(--color-border)] bg-black/30 px-2.5 py-2">
          <div className="flex items-center gap-1 text-[8px] tracking-[0.25em] font-mono text-[var(--color-text-dim)]">
            <DollarSign size={9} /> COSTO 7D
          </div>
          <div className="text-base font-bold font-mono tabular-nums text-[var(--color-text)]">
            ${t.cost_usd_7d_est.toFixed(3)}
          </div>
          <div className="text-[8px] font-mono text-[var(--color-text-dim)]">USD est.</div>
        </div>
        <div className="rounded border border-[var(--color-border)] bg-black/30 px-2.5 py-2">
          <div className="flex items-center gap-1 text-[8px] tracking-[0.25em] font-mono text-[var(--color-text-dim)]">
            <Activity size={9} /> SESIONES 7D
          </div>
          <div className="text-base font-bold font-mono tabular-nums text-[var(--color-text)]">
            {t.sessions_7d}
          </div>
          <div className="text-[8px] font-mono text-[var(--color-text-dim)]">total</div>
        </div>
      </div>

      {/* Provider distribution bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[8px] font-mono text-[var(--color-text-dim)] mb-1.5">
          <span className="tracking-[0.25em]">DISTRIBUCIÓN 7D</span>
          <span>{t.sessions_7d} sessions</span>
        </div>
        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden flex">
          {shares.groq > 0 && (
            <div
              className="h-full bg-[var(--color-green)] transition-all"
              style={{ width: `${shares.groq}%` }}
              title={`Groq ${shares.groq}%`}
            />
          )}
          {shares.anthropic > 0 && (
            <div
              className="h-full bg-[var(--color-amber)] transition-all"
              style={{ width: `${shares.anthropic}%` }}
              title={`Anthropic ${shares.anthropic}%`}
            />
          )}
          {shares.ollama > 0 && (
            <div
              className="h-full bg-[var(--color-cyan)] transition-all"
              style={{ width: `${shares.ollama}%` }}
              title={`Ollama ${shares.ollama}%`}
            />
          )}
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-[9px] font-mono">
          <span className="flex items-center gap-1 text-[var(--color-green)]">
            <Zap size={9} /> {shares.groq}%
          </span>
          <span className="flex items-center gap-1 text-[var(--color-amber)]">
            <Brain size={9} /> {shares.anthropic}%
          </span>
          <span className="flex items-center gap-1 text-[var(--color-cyan)]">
            <Cpu size={9} /> {shares.ollama}%
          </span>
        </div>
      </div>

      {/* Budget bar */}
      <div className="mb-2 flex-1">
        <div className="flex items-center justify-between text-[8px] font-mono text-[var(--color-text-dim)] mb-1.5">
          <span className="tracking-[0.25em]">BUDGET MENSUAL</span>
          <span className={budgetCritical ? "text-[var(--color-red)]" : budgetWarn ? "text-[var(--color-amber)]" : "text-[var(--color-text-dim)]"}>
            ${t.cost_usd_30d_est.toFixed(2)} / ${t.budget_month_usd}
          </span>
        </div>
        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              budgetCritical ? "bg-[var(--color-red)]" :
              budgetWarn ? "bg-[var(--color-amber)]" :
              "bg-[var(--color-green)]"
            }`}
            style={{ width: `${Math.min(100, t.budget_used_pct)}%` }}
          />
        </div>
        <div className="text-[8px] font-mono text-[var(--color-text-dim)] mt-1">
          {t.budget_used_pct}% del presupuesto · {30 - new Date().getDate()}d restantes
        </div>
      </div>

      {/* Errors footer */}
      {t.errors_24h > 0 && (
        <div className="mt-2 pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[9px] font-mono">
          <div className="flex items-center gap-1.5 text-[var(--color-amber)]">
            <AlertTriangle size={9} />
            <span className="tracking-widest">{t.errors_24h} ERRORES 24H</span>
          </div>
        </div>
      )}
    </div>
  );
}
