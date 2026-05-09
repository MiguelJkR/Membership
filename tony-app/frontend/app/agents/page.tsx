"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Activity, AlertTriangle, Eye, Newspaper, Brain, Zap } from "lucide-react";

const SPEC_AGENTS = [
  { id: "market_scanner", name: "MARKET_SCANNER", role: "Busca oportunidades técnicas", icon: Activity, accent: "cyan", workflows: ["ML Signals Watcher", "Autonomous Equity Scanner"] },
  { id: "risk_manager", name: "RISK_MANAGER", role: "Drawdown + stop-loss + margin", icon: AlertTriangle, accent: "red", workflows: ["Drawdown Circuit Breaker", "Stop Trailing Daily", "Risk Dashboard Daily"] },
  { id: "social_watcher", name: "SOCIAL_WATCHER", role: "Twitter/Reddit/Telegram sentiment", icon: Eye, accent: "purple", workflows: ["Sentiment Snapshot", "Sentiment Regime Alerts"] },
  { id: "news_agent", name: "NEWS_AGENT", role: "Macro + sector news", icon: Newspaper, accent: "amber", workflows: ["Macro Pre-Alert", "Earnings Pre-Alert"] },
  { id: "execution_bot", name: "EXECUTION_BOT", role: "Ejecuta orders OANDA/Moomoo", icon: Zap, accent: "green", workflows: ["OANDA Position Manager", "Sentiment Regime Trader", "Autonomous Strategy Engine"] },
  { id: "strategy_ai", name: "STRATEGY_AI", role: "Genera setups via Groq+Ollama", icon: Brain, accent: "cyan", workflows: ["Brain DMN", "Brain Sleep Cycle", "Brain User Model Updater"] },
];

const ACCENT: Record<string, string> = {
  cyan: "border-[var(--color-cyan)] text-[var(--color-cyan)] bg-[var(--color-cyan)]/5",
  green: "border-[var(--color-green)] text-[var(--color-green)] bg-[var(--color-green)]/5",
  red: "border-[var(--color-red)] text-[var(--color-red)] bg-[var(--color-red)]/5",
  amber: "border-[var(--color-amber)] text-[var(--color-amber)] bg-[var(--color-amber)]/5",
  purple: "border-purple-400 text-purple-400 bg-purple-400/5",
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<any>({});

  useEffect(() => {
    api.agents().then(setAgents);
    const i = setInterval(() => api.agents().then(setAgents), 60000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="p-5 space-y-4">
      <PageHeader
        title="AI Agents"
        subtitle={`MULTI-AGENT SYSTEM · ${agents.count || 0} N8N WORKFLOWS ACTIVE`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SPEC_AGENTS.map((a) => {
          const Icon = a.icon;
          const linkedActive = (agents.agents || []).filter((w: any) =>
            a.workflows.some((needle) => w.name.toLowerCase().includes(needle.toLowerCase().split(" ")[0]))
          );
          return (
            <Card key={a.id} className={`border-2 ${ACCENT[a.accent].split(" ")[0]}`} title={a.name}>
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full border-2 ${ACCENT[a.accent]} mb-3`}>
                <Icon size={24} strokeWidth={1.5} />
              </div>
              <div className="text-sm text-[var(--color-text)] font-semibold mb-1">{a.role}</div>
              <div className="text-[10px] text-[var(--color-text-dim)] font-mono mb-3">
                {linkedActive.length} workflow{linkedActive.length !== 1 ? "s" : ""} activo{linkedActive.length !== 1 ? "s" : ""}
              </div>
              <div className="flex flex-col gap-1">
                {linkedActive.slice(0, 3).map((w: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] text-[var(--color-text-dim)] font-mono">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-green)] animate-pulse" />
                    {w.name}
                  </div>
                ))}
                {linkedActive.length === 0 && (
                  <div className="text-[10px] text-[var(--color-text-dim)]">Sin matches en workflows</div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card title="LLM PROVIDERS · ACTIVE">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
            <div className="text-[10px] tracking-widest text-[var(--color-cyan)]">GROQ · PRIMARY</div>
            <div className="text-[11px] text-[var(--color-text)] font-mono mt-1">llama-3.3-70b-versatile</div>
            <div className="text-[9px] text-[var(--color-text-dim)] font-mono">cascade fallback to 8b on 429</div>
          </div>
          <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
            <div className="text-[10px] tracking-widest text-[var(--color-green)]">OLLAMA · LOCAL FALLBACK</div>
            <div className="text-[11px] text-[var(--color-text)] font-mono mt-1">llama3.2:3b</div>
            <div className="text-[9px] text-[var(--color-text-dim)] font-mono">CPU 1.9GB · 30-90s gen</div>
          </div>
          <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
            <div className="text-[10px] tracking-widest text-purple-400">ANTHROPIC · ON-DEMAND</div>
            <div className="text-[11px] text-[var(--color-text)] font-mono mt-1">claude-sonnet-4-6</div>
            <div className="text-[9px] text-[var(--color-text-dim)] font-mono">vision + thinking budget 5k</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
