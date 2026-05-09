"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";

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

  useEffect(() => {
    api.agents().then(setAgents);
    const i = setInterval(() => api.agents().then(setAgents), 60000);
    return () => clearInterval(i);
  }, []);

  const list = agents.agents || [];
  const categories = ["all", ...Array.from(new Set(list.map((a: any) => a.category)))];
  const filtered = filter === "all" ? list : list.filter((a: any) => a.category === filter);

  return (
    <div className="p-5 space-y-4">
      <PageHeader
        title="Workflows · n8n Orchestration"
        subtitle={`${agents.count || 0} ACTIVE · CRON + WEBHOOK + EVENT TRIGGERS`}
      />

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c: any) => {
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
      </div>

      <Card title={`${filtered.length} workflow${filtered.length !== 1 ? "s" : ""}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filtered.map((w: any, i: number) => {
            const colors = CATEGORY_COLORS[w.category] || CATEGORY_COLORS.default;
            return (
              <div key={i} className="px-3 py-2 bg-black/30 rounded border border-[var(--color-border)] hover:border-[var(--color-border-bright)] transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] text-[var(--color-text)] truncate">{w.name}</span>
                  <span className={`shrink-0 text-[8px] tracking-widest px-2 py-0.5 rounded border font-mono ${colors}`}>
                    {w.category?.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${w.active ? "bg-[var(--color-green)] animate-pulse" : "bg-[var(--color-text-dim)]"}`} />
                  <span className="text-[9px] text-[var(--color-text-dim)] font-mono">
                    {w.active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="WORKFLOW PIPELINE · TYPICAL FLOW" glow="cyan">
        <div className="overflow-x-auto">
          <div className="flex items-center gap-3 min-w-max py-4">
            {["WEBHOOK\nTRIGGER", "DATA\nFETCH", "AI\nANALYSIS", "RISK\nGATE", "EXECUTION", "TELEGRAM\nNOTIFY"].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-24 h-20 flex items-center justify-center text-center px-3 py-2 rounded-lg border-2 border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/5 text-[10px] tracking-widest text-[var(--color-cyan)] font-mono whitespace-pre-line">
                  {step}
                </div>
                {i < 5 && (
                  <div className="text-[var(--color-cyan)]/60 text-2xl">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
