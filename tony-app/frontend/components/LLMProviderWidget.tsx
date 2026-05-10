"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Cpu, Zap, Brain, Cloud, Loader2, Activity, AlertCircle } from "lucide-react";

type ProviderStatus = {
  ok: boolean;
  active: "groq" | "anthropic" | "ollama" | "none";
  active_label: string;
  active_color: "green" | "amber" | "cyan" | "red";
  providers: {
    groq: { available: boolean; in_cooldown: boolean; cooldown_remaining_s: number };
    anthropic: { available: boolean };
    ollama: { available: boolean };
  };
  recent_sessions: Array<{
    session_id: string;
    provider: string;
    model: string;
    status: string;
    iterations: number;
  }>;
  provider_counts_last_5: { groq: number; anthropic: number; ollama: number; unknown: number };
};

const PROVIDER_META: Record<string, {
  label: string; description: string; icon: any; color: string; tone: string;
}> = {
  groq: {
    label: "Groq",
    description: "Free tier · ultra-fast",
    icon: Zap,
    color: "text-[var(--color-green)]",
    tone: "border-[var(--color-green)]/40 bg-[var(--color-green)]/10",
  },
  anthropic: {
    label: "Anthropic Claude",
    description: "Sonnet 4.5 · pago por uso",
    icon: Brain,
    color: "text-[var(--color-amber)]",
    tone: "border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10",
  },
  ollama: {
    label: "Ollama Local",
    description: "llama3.1:8b · sin red",
    icon: Cpu,
    color: "text-[var(--color-cyan)]",
    tone: "border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10",
  },
};

/**
 * LLMProviderWidget — shows the LLM cascade in real time.
 *  - ACTIVE provider (large, animated)
 *  - 3-provider stack with availability dots
 *  - Cooldown countdown if Groq is rate-limited
 *  - Provider distribution in last 5 agent sessions
 */
export function LLMProviderWidget() {
  const [data, setData] = useState<ProviderStatus | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await api.llmProviderStatus();
        if (!cancelled && r.ok) setData(r as ProviderStatus);
      } catch {}
    };
    load();
    const refreshI = setInterval(load, 15000);
    // 1s tick to update cooldown countdown live
    const tickI = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      cancelled = true;
      clearInterval(refreshI);
      clearInterval(tickI);
    };
  }, []);

  if (!data) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur p-5 h-full flex items-center justify-center">
        <Loader2 size={14} className="animate-spin text-[var(--color-text-dim)]" />
      </div>
    );
  }

  const activeMeta = PROVIDER_META[data.active] || PROVIDER_META.ollama;
  const ActiveIcon = activeMeta.icon;
  const cooldown = data.providers.groq.cooldown_remaining_s;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] tracking-[0.25em] font-mono text-[var(--color-text)] font-semibold">
          LLM CASCADE
        </h3>
        <span className="text-[8px] tracking-widest font-mono text-[var(--color-text-dim)]">
          AUTO-REFRESH 15s
        </span>
      </div>

      {/* Active provider — big card */}
      <div className={`rounded border ${activeMeta.tone} p-4 mb-3`}>
        <div className="flex items-center gap-3">
          <div className={`relative w-12 h-12 rounded-full ${activeMeta.tone} border flex items-center justify-center shrink-0`}>
            <ActiveIcon size={20} className={activeMeta.color} />
            {data.active !== "none" && (
              <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${activeMeta.color.replace("text-", "bg-")} animate-pulse`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[8px] tracking-[0.3em] font-mono text-[var(--color-text-dim)]">
              ACTIVO AHORA
            </div>
            <div className={`text-base md:text-lg font-bold tracking-wide ${activeMeta.color}`}>
              {activeMeta.label}
            </div>
            <div className="text-[10px] font-mono text-[var(--color-text-dim)]">
              {activeMeta.description}
            </div>
          </div>
        </div>
      </div>

      {/* Cooldown banner if Groq is rate-limited */}
      {cooldown > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded border border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10 text-[10px] font-mono text-[var(--color-amber)]">
          <AlertCircle size={11} />
          <span>Groq en cooldown — {cooldown}s restantes (cae a Anthropic)</span>
        </div>
      )}

      {/* 3-provider stack */}
      <div className="space-y-1.5 flex-1">
        {(["groq", "anthropic", "ollama"] as const).map((key) => {
          const meta = PROVIDER_META[key];
          const Icon = meta.icon;
          const prov = data.providers[key];
          const isActive = data.active === key;
          const inCooldown = key === "groq" && data.providers.groq.in_cooldown;
          const dotColor =
            !prov.available ? "bg-[var(--color-red)]" :
            inCooldown ? "bg-[var(--color-amber)]" :
            isActive ? `${meta.color.replace("text-", "bg-")} glow-${key === "groq" ? "green" : key === "anthropic" ? "amber" : "cyan"}` :
            "bg-[var(--color-text-dim)]";
          const status =
            !prov.available ? "DOWN" :
            inCooldown ? "COOLDOWN" :
            isActive ? "ACTIVO" :
            "READY";
          const count = data.provider_counts_last_5[key] || 0;
          return (
            <div
              key={key}
              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded text-[10px] ${
                isActive ? `border ${meta.tone}` : "border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                <Icon size={11} className={prov.available ? meta.color : "text-[var(--color-text-dim)]"} />
                <span className={`font-mono tracking-wide ${prov.available ? "text-[var(--color-text)]" : "text-[var(--color-text-dim)]"}`}>
                  {meta.label}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {count > 0 && (
                  <span className="text-[8px] font-mono text-[var(--color-text-dim)]">
                    {count}× last5
                  </span>
                )}
                <span className={`text-[8px] tracking-widest font-mono ${
                  status === "ACTIVO" ? meta.color :
                  status === "COOLDOWN" ? "text-[var(--color-amber)]" :
                  status === "DOWN" ? "text-[var(--color-red)]" :
                  "text-[var(--color-text-dim)]"
                }`}>
                  {status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: most recent session */}
      {data.recent_sessions[0] && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-[9px] font-mono">
          <div className="flex items-center gap-1.5 text-[var(--color-text-dim)]">
            <Activity size={9} />
            <span>Última sesión:</span>
          </div>
          <span className={`tracking-wider ${
            data.recent_sessions[0].status === "complete"
              ? "text-[var(--color-green)]"
              : "text-[var(--color-amber)]"
          }`}>
            {(data.recent_sessions[0].provider || "?").toUpperCase()} ·{" "}
            {data.recent_sessions[0].iterations}iter ·{" "}
            {data.recent_sessions[0].status}
          </span>
        </div>
      )}
    </div>
  );
}
