"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/Card";
import { Server, Database, Plug, Activity, Cloud, Webhook as WebhookIcon, Mic, Bot } from "lucide-react";

type SubsystemRow = {
  key: string;
  label: string;
  icon: any;
  ok: boolean;
  detail?: string;
};

/**
 * Side panel "ESTADO SISTEMAS" con dots animados, listado de servicios.
 * Combina /api/system_status + /api/health para componer la lista.
 */
export function SystemStatusPanel() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const sys = await api.systemStatus();
        if (!cancelled) setData(sys);
      } catch {}
    }
    load();
    const i = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, []);

  if (!data) {
    return (
      <Card title="ESTADO DEL SISTEMA">
        <div className="text-[10px] text-[var(--color-text-dim)] font-mono py-2">
          Cargando...
        </div>
      </Card>
    );
  }

  const ss = data.subsystems || {};
  const tools = data.tools || {};

  const rows: SubsystemRow[] = [
    {
      key: "flask",
      label: "Servidor Flask",
      icon: Server,
      ok: !!ss.flask?.listening,
      detail: ":8765",
    },
    {
      key: "nextjs",
      label: "Frontend Next.js",
      icon: Cloud,
      ok: !!ss.nextjs?.listening,
      detail: ":3000",
    },
    {
      key: "n8n",
      label: "n8n Engine",
      icon: Activity,
      ok: !!ss.n8n?.listening,
      detail: "workflows",
    },
    {
      key: "moomoo_opend",
      label: "Moomoo OpenD",
      icon: Database,
      ok: !!ss.moomoo_opend?.listening,
      detail: "quote+trade",
    },
    {
      key: "ollama",
      label: "Ollama Local LLM",
      icon: Bot,
      ok: !!ss.ollama?.listening,
      detail: "llama3.2:3b",
    },
    {
      key: "memory",
      label: "Memoria Tony",
      icon: Plug,
      ok: !!ss.memory?.available,
      detail: `${ss.memory?.total_indexed || 0} sesiones`,
    },
    {
      key: "tools",
      label: "Herramientas",
      icon: Bot,
      ok: (tools.total || 0) > 0,
      detail: `${tools.read_only || 0}+${tools.gated || 0}`,
    },
    {
      key: "cloudflared",
      label: "Cloudflare Tunnel",
      icon: WebhookIcon,
      ok: !!ss.cloudflared?.running,
      detail: ss.cloudflared?.running ? "online" : "deploy pendiente",
    },
  ];

  const upCount = rows.filter((r) => r.ok).length;
  const allUp = upCount === rows.length;
  const someDown = upCount < rows.length;

  return (
    <Card title="ESTADO DEL SISTEMA">
      <div className="flex items-center gap-2 mb-3 text-[10px] tracking-widest font-mono">
        <span className={`w-2 h-2 rounded-full ${
          allUp ? "bg-[var(--color-green)] glow-green animate-pulse"
          : someDown ? "bg-[var(--color-amber)] animate-pulse"
          : "bg-[var(--color-red)]"
        }`} />
        <span className={
          allUp ? "text-[var(--color-green)]"
          : someDown ? "text-[var(--color-amber)]"
          : "text-[var(--color-red)]"
        }>
          {allUp ? "TODOS LOS SISTEMAS OPERATIVOS"
            : `${upCount}/${rows.length} OPERATIVOS`}
        </span>
      </div>

      <div className="space-y-1.5">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.key} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-white/[0.02]">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  r.ok
                    ? "bg-[var(--color-green)] glow-green animate-pulse"
                    : "bg-[var(--color-red)]"
                }`} />
                <Icon size={11} strokeWidth={1.5} className={r.ok ? "text-[var(--color-text-dim)]" : "text-[var(--color-red)]/60"} />
                <span className="text-[11px] text-[var(--color-text)] truncate">{r.label}</span>
              </div>
              <span className={`text-[9px] font-mono shrink-0 ${
                r.ok ? "text-[var(--color-text-dim)]" : "text-[var(--color-red)]"
              }`}>
                {r.detail}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer: composite score */}
      {data.health?.composite_score !== undefined && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
          <span className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">HEALTH COMPOSITE</span>
          <span className={`text-sm font-bold font-mono tabular-nums ${
            data.health.composite_score >= 80 ? "text-[var(--color-green)]"
            : data.health.composite_score >= 60 ? "text-[var(--color-amber)]"
            : "text-[var(--color-red)]"
          }`}>
            {data.health.composite_score}/100
          </span>
        </div>
      )}
    </Card>
  );
}
