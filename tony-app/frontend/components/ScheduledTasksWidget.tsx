"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Clock, CheckCircle2, XCircle, Loader2, AlertTriangle,
  Workflow, Cpu, MoreVertical,
} from "lucide-react";

type CronItem = {
  kind: "windows" | "n8n";
  name: string;
  state: string;
  last_run?: string;
  next_run?: string;
  last_result_code?: number;
  last_ok?: boolean;
  schedule?: string;
  workflow_id?: string;
};

type CronStatus = {
  ok: boolean;
  items: CronItem[];
  windows_count: number;
  n8n_count: number;
  total: number;
};

const RESULT_CODES: Record<number, string> = {
  0: "OK",
  267009: "Running",
  267011: "Nunca ejecutada",
  267014: "Stopped por usuario",
  2147750687: "Already running",
};

/** SCHEDULED TASKS — Windows + n8n cron jobs */
export function ScheduledTasksWidget() {
  const [data, setData] = useState<CronStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await api.systemCronTasks();
        if (!cancelled && r.ok) setData(r as CronStatus);
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

  const fmtTimeAgo = (ts?: string) => {
    if (!ts) return "—";
    try {
      const d = new Date(ts);
      // Sentinel "1999-11-30" = nunca ejecutada
      if (d.getFullYear() < 2000) return "nunca";
      const diff = Date.now() - d.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 0) return "futuro";
      if (mins < 1) return "ahora";
      if (mins < 60) return `${mins}m`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h`;
      return `${Math.floor(hours / 24)}d`;
    } catch {
      return "—";
    }
  };

  const itemTone = (item: CronItem) => {
    if (item.state === "Running") return "amber";
    if (item.kind === "windows" && item.last_result_code === 0) return "green";
    if (item.last_ok === true) return "green";
    if (item.last_result_code === 267011) return "default"; // never ran (not error)
    if (item.last_ok === false) return "red";
    return "default";
  };

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] tracking-[0.25em] font-mono text-[var(--color-text)] font-semibold flex items-center gap-2">
          <Clock size={12} className="text-[var(--color-amber)]" />
          CRON TASKS
        </h3>
        <button className="text-[var(--color-text-dim)] hover:text-[var(--color-amber)]">
          <MoreVertical size={14} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="flex flex-col">
          <span className="text-[8px] tracking-[0.25em] font-mono text-[var(--color-text-dim)]">WINDOWS</span>
          <span className="text-base font-bold font-mono tabular-nums text-[var(--color-cyan)]">
            {data.windows_count}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] tracking-[0.25em] font-mono text-[var(--color-text-dim)]">N8N CRON</span>
          <span className="text-base font-bold font-mono tabular-nums text-[var(--color-green)]">
            {data.n8n_count}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] tracking-[0.25em] font-mono text-[var(--color-text-dim)]">TOTAL</span>
          <span className="text-base font-bold font-mono tabular-nums text-[var(--color-text)]">
            {data.total}
          </span>
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-56">
        {data.items.length === 0 && (
          <div className="text-center py-4 text-[10px] font-mono text-[var(--color-text-dim)]">
            Sin tasks programadas
          </div>
        )}
        {data.items.map((item, idx) => {
          const tone = itemTone(item);
          const KindIcon = item.kind === "n8n" ? Workflow : Cpu;
          const StatusIcon =
            item.state === "Running" ? Loader2 :
            tone === "green" ? CheckCircle2 :
            tone === "red" ? XCircle :
            tone === "amber" ? AlertTriangle :
            Clock;
          const tonePalette = {
            green: "text-[var(--color-green)]",
            amber: "text-[var(--color-amber)]",
            red: "text-[var(--color-red)]",
            default: "text-[var(--color-text-dim)]",
          }[tone];
          return (
            <div
              key={`${item.kind}-${idx}`}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded border border-[var(--color-border)] bg-black/30 text-[10px]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <StatusIcon
                  size={10}
                  className={`${tonePalette} shrink-0 ${item.state === "Running" ? "animate-spin" : ""}`}
                />
                <KindIcon size={10} className="text-[var(--color-text-dim)] shrink-0" />
                <span className="font-mono text-[var(--color-text)] truncate" title={item.name}>
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.schedule && (
                  <span className="text-[8px] font-mono text-[var(--color-text-dim)]">
                    {item.schedule}
                  </span>
                )}
                <span className={`text-[8px] tracking-widest font-mono ${tonePalette}`}>
                  {item.last_run ? fmtTimeAgo(item.last_run) : item.state.toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="mt-3 pt-2 border-t border-[var(--color-border)] text-[8px] font-mono text-[var(--color-text-dim)] text-center">
        AUTO-REFRESH 60s · Boot tasks + n8n cron triggers
      </div>
    </div>
  );
}
