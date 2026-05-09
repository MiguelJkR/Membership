"use client";
import { Card, MiniMetric } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Lock, Activity, Cpu, Database, Wifi, AlertTriangle } from "lucide-react";

const STATUS = [
  { label: "n8n WORKFLOWS", value: "OK", icon: Activity, status: "green" },
  { label: "OLLAMA LOCAL", value: "RUNNING", icon: Cpu, status: "green" },
  { label: "FILE_WRITER", value: ":9091 OK", icon: Database, status: "green" },
  { label: "NGROK TUNNEL", value: "ACTIVE", icon: Wifi, status: "green" },
  { label: "TONY DASHBOARD", value: ":8765 OK", icon: Activity, status: "green" },
  { label: "GROQ API", value: "RATE-LMT", icon: AlertTriangle, status: "amber" },
];

const VAULT = [
  { label: "groq_api_key.txt", status: "secured" },
  { label: "n8n_api_key.txt", status: "secured" },
  { label: "email_config.json", status: "secured (gitignored)" },
  { label: "ML_Bot/.env", status: "secured" },
  { label: "GitHub PAT", status: "vault://offsite" },
];

export default function SecurityPage() {
  return (
    <div className="p-5 space-y-4">
      <PageHeader title="Security Center" subtitle="API MONITORING · VAULT · THREAT DETECTION · FAILOVER" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS.map((s) => {
          const Icon = s.icon;
          const color = s.status === "green" ? "text-[var(--color-green)]" : s.status === "amber" ? "text-[var(--color-amber)]" : "text-[var(--color-red)]";
          return (
            <Card key={s.label} className="text-center">
              <Icon size={20} className={`mx-auto ${color} mb-2`} strokeWidth={1.5} />
              <div className="text-[8px] tracking-widest text-[var(--color-text-dim)]">{s.label}</div>
              <div className={`text-[11px] font-mono ${color}`}>{s.value}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="VAULT · CREDENTIALS" glow="cyan">
          <div className="flex flex-col gap-1.5">
            {VAULT.map((v) => (
              <div key={v.label} className="flex items-center justify-between px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <Lock size={12} className="text-[var(--color-green)]" />
                  <span className="text-[11px] font-mono text-[var(--color-text)]">{v.label}</span>
                </div>
                <span className="text-[9px] tracking-widest font-mono text-[var(--color-green)]">{v.status.toUpperCase()}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 px-3 py-2 bg-black/40 rounded border border-[var(--color-cyan)]/40">
            <div className="text-[10px] tracking-widest text-[var(--color-cyan)] font-mono">ENCRYPTION</div>
            <div className="text-[10px] text-[var(--color-text-dim)] mt-1">Backup writer encrypts via age + GitHub private offsite</div>
          </div>
        </Card>

        <Card title="WATCHDOG · SELF-HEALING" glow="green">
          <div className="flex flex-col gap-2">
            <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
              <div className="text-[10px] tracking-widest text-[var(--color-green)] font-mono">PROCESSES MONITORED</div>
              <ul className="text-[11px] text-[var(--color-text-dim)] mt-1 space-y-0.5">
                <li>• n8n (5678)</li>
                <li>• ngrok tunnel</li>
                <li>• tony_dashboard.py (8765)</li>
                <li>• ollama (11434)</li>
                <li>• local_file_writer.py (9091)</li>
              </ul>
            </div>
            <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
              <div className="text-[10px] tracking-widest text-[var(--color-amber)] font-mono">AUTO-RECOVERY</div>
              <div className="text-[11px] text-[var(--color-text-dim)] mt-1">
                Watchdog cycles every 60s, restarts on health check fail, log rotation hourly, Telegram alerts on issues.
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="THREAT DETECTION · LIVE">
        <div className="text-[11px] text-[var(--color-text-dim)]">
          <div className="mb-2">Norton AI Agent Protection activo · CLT-CMD intercept</div>
          <div className="flex items-center gap-2 text-[var(--color-green)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-green)] animate-pulse" />
            No threats detected last 24h
          </div>
        </div>
      </Card>
    </div>
  );
}
