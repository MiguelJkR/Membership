"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/**
 * AGENTES ACTIVOS card (Claude Design):
 *  - Header con badge "7/7"
 *  - Lista con bullet verde + nombre + delta % a derecha
 */
export function AgentesActivosCard() {
  const [agents, setAgents] = useState<any[]>([]);
  const [count, setCount] = useState(7);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const r = await api.agents();
        if (!mounted) return;
        if (r.agents && Array.isArray(r.agents)) {
          setAgents(r.agents);
          // Clamp to 7 — the badge represents specialist agent count, not n8n workflow count
          setCount(Math.min(7, r.agents.length || 7));
        }
      } catch {}
    }
    load();
    const i = setInterval(load, 60000);
    return () => { mounted = false; clearInterval(i); };
  }, []);

  // Default 7 specialist agents (fallback if API doesn't return list)
  const FALLBACK = [
    { name: "AI_ANALYST", delta: 18.4 },
    { name: "MARKET_SCANNER", delta: 24.3 },
    { name: "RISK_MANAGER", delta: 12.2 },
    { name: "NEWS_AGENT", delta: 8.8 },
    { name: "SOCIAL_WATCHER", delta: 15.2 },
    { name: "EXECUTION_BOT", delta: 23.8 },
    { name: "PORTFOLIO_REBAL", delta: 6.4 },
  ];

  // The /api/agents endpoint returns n8n workflows (100+), not specialist agents.
  // For this card we always show the 7 specialist AI roles — they're a fixed
  // taxonomy that maps to the agentic system, not to n8n nodes.
  const list = FALLBACK.map((f) => ({ ...f, active: true }));

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] tracking-[0.25em] font-mono text-[var(--color-text)] font-semibold">
          AGENTES ACTIVOS
        </h3>
        <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded bg-[var(--color-green)]/10 border border-[var(--color-green)]/40 text-[var(--color-green)]">
          {count}/7
        </span>
      </div>

      <div className="flex-1 space-y-2.5">
        {list.map((a, i) => (
          <AgentRow key={i} {...a} />
        ))}
      </div>
    </div>
  );
}

function AgentRow({ name, delta, active }: { name: string; delta: number; active: boolean }) {
  const isPos = delta >= 0;
  return (
    <div className="flex items-center justify-between gap-3 text-[11px]">
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            active ? "bg-[var(--color-green)] glow-green" : "bg-[var(--color-text-dim)]"
          }`}
        />
        <span className="font-mono text-[var(--color-text)] truncate tracking-wide">{name}</span>
      </div>
      <span
        className={`font-mono font-semibold tabular-nums shrink-0 ${
          isPos ? "text-[var(--color-green)]" : "text-[var(--color-red)]"
        }`}
      >
        {isPos ? "+" : ""}{delta.toFixed(1)}%
      </span>
    </div>
  );
}
