"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Bot, Brain, Activity, AlertTriangle, Eye, Zap, Newspaper,
  Loader2, CheckCircle2, XCircle, Workflow, ChevronRight,
  Sparkles, ShieldAlert,
} from "lucide-react";
import Link from "next/link";

const ICON_MAP: Record<string, any> = {
  Brain, Activity, AlertTriangle, Eye, Zap, Newspaper,
  Sparkles, Bot, ShieldAlert,
};

const ACCENT_TONE: Record<string, { color: string; bg: string }> = {
  cyan: { color: "text-[var(--color-cyan)]", bg: "border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10" },
  green: { color: "text-[var(--color-green)]", bg: "border-[var(--color-green)]/40 bg-[var(--color-green)]/10" },
  amber: { color: "text-[var(--color-amber)]", bg: "border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10" },
  red: { color: "text-[var(--color-red)]", bg: "border-[var(--color-red)]/40 bg-[var(--color-red)]/10" },
  purple: { color: "text-purple-400", bg: "border-purple-400/40 bg-purple-400/10" },
};

/** AGENT ROOMS — visualización de los specialist agents con sus workflows asociados */
export function AgentRoomsWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await api.specialistAgentsLive();
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

  const fmtAge = (ts: string | null) => {
    if (!ts) return "nunca";
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
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] tracking-[0.25em] font-mono text-[var(--color-text)] font-semibold flex items-center gap-2">
          <Bot size={12} className="text-[var(--color-green)]" />
          AGENT ROOMS · SPECIALIST CREW
        </h3>
        <Link
          href="/agents"
          className="text-[9px] tracking-widest font-mono text-[var(--color-text-dim)] hover:text-[var(--color-green)] flex items-center gap-1"
        >
          EDITAR CONFIG <ChevronRight size={10} />
        </Link>
      </div>

      <div className="text-[8px] tracking-[0.3em] font-mono text-[var(--color-text-dim)] mb-4 uppercase">
        {data.agent_count} specialists configurados · workflows cruzados con n8n live
      </div>

      {/* Grid de specialists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.agents.map((ag: any) => {
          const Icon = ICON_MAP[ag.icon] || Bot;
          const tone = ACCENT_TONE[ag.accent] || ACCENT_TONE.cyan;
          const isExpanded = expanded === ag.id;
          const stats = ag.stats;
          const isHealthy = stats.health_pct >= 70;
          const isPartial = stats.health_pct > 0 && stats.health_pct < 70;
          const isOffline = stats.health_pct === 0;

          return (
            <div
              key={ag.id}
              className={`rounded border ${tone.bg} cursor-pointer transition-all hover:scale-[1.02] ${
                isExpanded ? "ring-1 ring-current" : ""
              }`}
              onClick={() => setExpanded(isExpanded ? null : ag.id)}
            >
              <div className="p-3">
                {/* Top: avatar + name + status */}
                <div className="flex items-start gap-2.5 mb-2">
                  <div className={`w-9 h-9 rounded-full ${tone.bg} border flex items-center justify-center shrink-0`}>
                    <Icon size={15} className={tone.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-bold font-mono tracking-wide ${tone.color} truncate`}>
                        {ag.name}
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isHealthy ? "bg-[var(--color-green)] glow-green" :
                        isPartial ? "bg-[var(--color-amber)]" :
                        "bg-[var(--color-text-dim)]"
                      }`} />
                    </div>
                    <div className="text-[9px] font-mono text-[var(--color-text-dim)] line-clamp-2">
                      {ag.role}
                    </div>
                  </div>
                </div>

                {/* Stats line */}
                <div className="flex items-center gap-3 text-[9px] font-mono">
                  <span className="flex items-center gap-1">
                    <Workflow size={9} className="text-[var(--color-text-dim)]" />
                    <span className={tone.color}>{stats.active}</span>
                    <span className="text-[var(--color-text-dim)]">/{stats.linked_total} wf</span>
                  </span>
                  <span className="text-[var(--color-text-dim)]">·</span>
                  <span className="flex items-center gap-1">
                    <Sparkles size={9} className="text-[var(--color-text-dim)]" />
                    <span className="text-[var(--color-text-dim)]">{ag.tools_count} tools</span>
                  </span>
                  <span className="ml-auto text-[var(--color-text-dim)]">
                    {fmtAge(stats.last_execution_ts)}
                  </span>
                </div>

                {/* Health bar */}
                <div className="mt-2 h-1 w-full bg-black/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isHealthy ? "bg-[var(--color-green)]" :
                      isPartial ? "bg-[var(--color-amber)]" :
                      "bg-[var(--color-text-dim)]/40"
                    }`}
                    style={{ width: `${Math.max(stats.health_pct, 5)}%` }}
                  />
                </div>

                {/* Expanded: workflow list */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)]/50 space-y-1.5">
                    <div className="text-[8px] tracking-[0.25em] font-mono text-[var(--color-text-dim)]">
                      WORKFLOWS LINKED ({ag.workflows.length})
                    </div>
                    {ag.workflows.map((wf: any, i: number) => {
                      const wfTone =
                        !wf.found ? "text-[var(--color-text-dim)]" :
                        wf.last_status === "error" ? "text-[var(--color-red)]" :
                        wf.last_status === "success" ? "text-[var(--color-green)]" :
                        wf.active ? "text-[var(--color-cyan)]" :
                        "text-[var(--color-amber)]";
                      const StatusIcon =
                        !wf.found ? AlertTriangle :
                        wf.last_status === "error" ? XCircle :
                        wf.active ? CheckCircle2 :
                        AlertTriangle;
                      return (
                        <div key={i} className="flex items-center gap-1.5 text-[9px] font-mono">
                          <StatusIcon size={9} className={`${wfTone} shrink-0`} />
                          <span className="truncate text-[var(--color-text)]" title={wf.name}>
                            {wf.name}
                          </span>
                          <span className={`ml-auto text-[8px] ${wfTone}`}>
                            {!wf.found ? "missing" : wf.active ? "active" : "off"}
                          </span>
                        </div>
                      );
                    })}
                    {ag.trigger_keywords && ag.trigger_keywords.length > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-[var(--color-border)]/30">
                        <div className="text-[8px] tracking-[0.25em] font-mono text-[var(--color-text-dim)] mb-1">
                          TRIGGER KEYWORDS
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {ag.trigger_keywords.slice(0, 6).map((k: string) => (
                            <span
                              key={k}
                              className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${tone.bg} border ${tone.color}`}
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-[9px] font-mono">
        <span className="text-[var(--color-text-dim)]">
          Click un specialist para expandir workflows + keywords
        </span>
        <span className="text-[var(--color-text-dim)]">AUTO-REFRESH 60s</span>
      </div>
    </div>
  );
}
