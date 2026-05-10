"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Workflow, CheckCircle2, XCircle, Loader2, Activity,
  AlertTriangle, MoreVertical, ChevronRight,
} from "lucide-react";
import Link from "next/link";

type WorkflowsStatus = {
  ok: boolean;
  total: number;
  active: number;
  inactive: number;
  executions_24h: { success: number; error: number; running: number; total: number };
  top_error_workflows: Array<{ workflow_id: string; name: string; errors: number }>;
  last_success_ts: string | null;
  last_error_ts: string | null;
};

/** N8N WORKFLOWS — live status of automation engine */
export function N8nWorkflowsWidget() {
  const [data, setData] = useState<WorkflowsStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await api.n8nWorkflowsStatus();
        if (!cancelled && r.ok) setData(r as WorkflowsStatus);
      } catch {}
      if (!cancelled) setLoading(false);
    };
    load();
    const i = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(i); };
  }, []);

  if (loading || !data) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur p-5 h-full flex items-center justify-center">
        <Loader2 size={14} className="animate-spin text-[var(--color-text-dim)]" />
      </div>
    );
  }

  const ex = data.executions_24h;
  const successRate = ex.total > 0 ? (ex.success / ex.total) * 100 : 100;
  const isHealthy = ex.error === 0 && data.active > 0;

  const fmtTimeAgo = (ts: string | null) => {
    if (!ts) return "—";
    try {
      const diff = Date.now() - new Date(ts).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "ahora";
      if (mins < 60) return `${mins}m`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h`;
      return `${Math.floor(hours / 24)}d`;
    } catch {
      return "—";
    }
  };

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] tracking-[0.25em] font-mono text-[var(--color-text)] font-semibold flex items-center gap-2">
          <Workflow size={12} className="text-[var(--color-cyan)]" />
          N8N WORKFLOWS
        </h3>
        <Link
          href="/workflows"
          className="text-[var(--color-text-dim)] hover:text-[var(--color-cyan)]"
        >
          <MoreVertical size={14} />
        </Link>
      </div>

      {/* Big numbers row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="flex flex-col">
          <span className="text-[8px] tracking-[0.25em] font-mono text-[var(--color-text-dim)]">ACTIVOS</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-[var(--color-green)]">
            {data.active}
          </span>
          <span className="text-[8px] font-mono text-[var(--color-text-dim)]">de {data.total}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] tracking-[0.25em] font-mono text-[var(--color-text-dim)]">ÉXITO 24H</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-[var(--color-green)]">
            {ex.success}
          </span>
          <span className="text-[8px] font-mono text-[var(--color-text-dim)]">{successRate.toFixed(0)}% rate</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] tracking-[0.25em] font-mono text-[var(--color-text-dim)]">ERRORES 24H</span>
          <span
            className={`text-2xl font-bold font-mono tabular-nums ${
              ex.error === 0 ? "text-[var(--color-text-dim)]" : "text-[var(--color-red)]"
            }`}
          >
            {ex.error}
          </span>
          <span className="text-[8px] font-mono text-[var(--color-text-dim)]">
            {ex.running > 0 ? `${ex.running} corriendo` : "sin pendientes"}
          </span>
        </div>
      </div>

      {/* Health bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] tracking-[0.25em] font-mono text-[var(--color-text-dim)]">
            SALUD AUTOMATION
          </span>
          <span
            className={`text-[9px] tracking-widest font-mono ${
              isHealthy ? "text-[var(--color-green)]" : "text-[var(--color-amber)]"
            }`}
          >
            {isHealthy ? "PERFECTO" : ex.error > 5 ? "DEGRADADO" : "OK CON ALERTAS"}
          </span>
        </div>
        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              isHealthy ? "bg-[var(--color-green)]" : "bg-[var(--color-amber)]"
            }`}
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>

      {/* Top error workflows (if any) */}
      {data.top_error_workflows.length > 0 ? (
        <div className="space-y-1.5 flex-1">
          <div className="text-[8px] tracking-[0.25em] font-mono text-[var(--color-text-dim)] mb-1">
            TOP CON ERRORES
          </div>
          {data.top_error_workflows.slice(0, 3).map((wf) => (
            <div
              key={wf.workflow_id}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded border border-[var(--color-red)]/30 bg-[var(--color-red)]/5 text-[10px]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle size={10} className="text-[var(--color-red)] shrink-0" />
                <span className="font-mono text-[var(--color-text)] truncate" title={wf.name}>
                  {wf.name}
                </span>
              </div>
              <span className="text-[var(--color-red)] font-mono font-semibold shrink-0">
                {wf.errors}×
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-3 py-2 text-[10px] font-mono text-[var(--color-text-dim)] border border-dashed border-[var(--color-green)]/30 rounded">
          <CheckCircle2 size={16} className="text-[var(--color-green)] mb-1" />
          <span className="text-[var(--color-green)]">Cero errores en 24h</span>
          <span>Toda la automation corriendo limpia</span>
        </div>
      )}

      {/* Footer: last activity */}
      <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-[9px] font-mono">
        <div className="flex items-center gap-1.5 text-[var(--color-text-dim)]">
          <Activity size={9} />
          <span>Último éxito:</span>
        </div>
        <span className="text-[var(--color-green)] tracking-wider">
          {fmtTimeAgo(data.last_success_ts)}
        </span>
      </div>
    </div>
  );
}
