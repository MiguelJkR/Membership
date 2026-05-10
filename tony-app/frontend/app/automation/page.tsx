"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, MiniMetric } from "@/components/Card";
import { Calendar, Clock, RefreshCw, Zap } from "lucide-react";

const N8N_CRONS = [
  { name: "Email Hourly Check + Telegram Alert", interval: "1h", lastRun: "00:00 UTC" },
  { name: "Daily Digest 8am", interval: "08:00 ET", lastRun: "today" },
  { name: "Daily Standup 830am", interval: "08:30 ET", lastRun: "today" },
  { name: "Brain DMN", interval: "1h", lastRun: "21:00 UTC" },
  { name: "Tony Daily Brief", interval: "07:30 ET", lastRun: "today" },
  { name: "Watchdog v2", interval: "60s", lastRun: "now" },
];

export default function AutomationPage() {
  const [scheduled, setScheduled] = useState<any>({});

  useEffect(() => {
    api.scheduledTasks().then(setScheduled);
    const t = setInterval(() => api.scheduledTasks().then(setScheduled), 60000);
    return () => clearInterval(t);
  }, []);

  const SCHEDULED = scheduled.tasks || [];

  return (
    <div className="p-4 md:p-5 space-y-4">
      {/* Subheader strip — Claude Design vocabulary */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/60 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-[var(--color-green)]" />
          <span className="text-[10px] tracking-[0.3em] font-mono text-[var(--color-text-dim)]">
            CENTRO DE AUTOMATIZACIÓN · TAREAS PROGRAMADAS · CRONS N8N · WATCHDOG
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniMetric label="PROGRAMADAS" value={`${SCHEDULED.length}`} tone="cyan" />
        <MiniMetric label="CRONS N8N" value={`${N8N_CRONS.length}`} tone="green" />
        <MiniMetric label="WATCHDOG" value="ACTIVO" tone="green" />
        <MiniMetric label="ÚLTIMO DISPARO" value="60s" tone="amber" />
      </div>

      <Card title="TAREAS PROGRAMADAS CLAUDE · ÚNICAS + RECURRENTES" glow="cyan">
        <div className="flex flex-col gap-1.5">
          {SCHEDULED.map((t: any) => {
            const isRecurring = !!t.cron;
            return (
              <div key={t.id} className="flex items-center justify-between px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                <div className="flex items-center gap-3 min-w-0">
                  {isRecurring ? (
                    <RefreshCw size={14} className="text-[var(--color-green)] shrink-0" />
                  ) : (
                    <Calendar size={14} className="text-[var(--color-cyan)] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-[11px] text-[var(--color-text)] truncate font-semibold">{t.description}</div>
                    <div className="text-[9px] text-[var(--color-text-dim)] font-mono">{t.id}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[var(--color-amber)] shrink-0">
                  {isRecurring ? `cron: ${t.cron}` : t.fireAt?.substr(0, 16) || "—"}
                </span>
              </div>
            );
          })}
          {!SCHEDULED.length && (
            <div className="text-[10px] text-[var(--color-text-dim)] py-4 flex items-center gap-2">
              <Clock size={12} />Cargando tareas...
            </div>
          )}
        </div>
      </Card>

      <Card title="N8N · FLUJOS CRON" glow="green">
        <div className="flex flex-col gap-1.5">
          {N8N_CRONS.map((c) => (
            <div key={c.name} className="flex items-center justify-between px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <Clock size={14} className="text-[var(--color-green)]" />
                <span className="text-[11px] text-[var(--color-text)]">{c.name}</span>
              </div>
              <div className="flex gap-3 text-[10px] font-mono">
                <span className="text-[var(--color-cyan)]">{c.interval}</span>
                <span className="text-[var(--color-text-dim)]">{c.lastRun}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
