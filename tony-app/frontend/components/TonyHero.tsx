"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Play, Settings } from "lucide-react";

/**
 * Hero compact (Claude Design match):
 *  - Header line: AUTONOMOUS TRADING OS · v2.0.1
 *  - HUGE title "TONY"
 *  - Subtitle "AI TRADING BOT · n8n AUTOMATION"
 *  - Tagline + 2 botones (IR AL DASHBOARD + CONFIGURAR BOT)
 *  - Inline telemetría arriba derecha (UPTIME / NODES / AGENTS / HEALTH)
 *  - Background: silueta de Tony + globo radial blur
 *  - Footer: ● SISTEMA ACTIVO · Conectado a n8n · N nodos
 */
export function TonyHero() {
  const [stats, setStats] = useState<any>({});
  const [uptimeNow, setUptimeNow] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [up, agents, sys] = await Promise.all([
          api.uptime(),
          api.agents(),
          api.systemStatus(),
        ]);
        if (cancelled) return;
        setStats({
          start_ts: up.start_ts,
          n8n_active: agents.count || 0,
          health: sys.health?.composite_score,
          tools_total: sys.tools?.total || 22,
        });
      } catch {}
    }
    load();
    const i = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(i); };
  }, []);

  useEffect(() => {
    if (!stats.start_ts) return;
    const tick = () => setUptimeNow(Math.floor(Date.now() / 1000) - stats.start_ts);
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [stats.start_ts]);

  function fmtUptimeShort(s: number): string {
    if (s < 0) return "—";
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    return `${d}d ${h}h`;
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-[var(--color-green)]/20 bg-gradient-to-br from-[var(--color-bg-card)] via-black/80 to-black/95 min-h-[420px]">
      {/* Background scanlines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(72,255,128,0.5) 3px, transparent 4px)",
        }}
      />

      {/* Tony silhouette background — left/center */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-end pointer-events-none">
        <div className="relative w-full h-full">
          <Image
            src="/tony-character-1.png"
            alt=""
            fill
            className="object-contain object-left-bottom opacity-25"
            style={{
              filter: "contrast(1.4) brightness(0.6) hue-rotate(80deg) saturate(1.2)",
              maskImage: "linear-gradient(to right, black 0%, black 60%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to right, black 0%, black 60%, transparent 100%)",
            }}
            priority
          />
        </div>
      </div>

      {/* Globe-mundo radial — right */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[280px] h-[280px] pointer-events-none opacity-50">
        <GlobeWireframe />
      </div>

      {/* Cyan/green radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 30% 60%, rgba(72,255,128,0.10), transparent 60%)",
        }}
      />

      {/* Content layer */}
      <div className="relative p-6 md:p-8 flex flex-col h-full min-h-[420px]">
        {/* Top row: header line + telemetry */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="text-[9px] tracking-[0.4em] font-mono text-[var(--color-green)]">
            AUTONOMOUS TRADING OS · v2.0.1
          </div>

          {/* Inline telemetry */}
          <div className="flex items-start gap-5 text-right">
            <Telemetry label="UPTIME" value={stats.start_ts ? fmtUptimeShort(uptimeNow) : "—"} />
            <Telemetry
              label="NODES"
              value={`${stats.n8n_active || 0}/${stats.n8n_active || 0}`}
              tone="green"
            />
            <Telemetry label="AGENTS" value="7/7" tone="green" />
            <Telemetry
              label="HEALTH"
              value={stats.health !== undefined ? `${stats.health}%` : "—"}
              tone={
                stats.health >= 80 ? "green" : stats.health >= 60 ? "amber" : "red"
              }
            />
          </div>
        </div>

        {/* Middle: HUGE TONY + subtitle + tagline + CTAs */}
        <div className="flex-1 flex flex-col justify-center mt-8 max-w-3xl">
          <h1
            className="text-7xl md:text-8xl lg:text-[120px] font-black leading-[0.85] text-[var(--color-green)] tracking-tight"
            style={{
              textShadow:
                "0 0 40px rgba(72,255,128,0.5), 0 0 80px rgba(72,255,128,0.25)",
              fontFamily: "'Consolas', 'SF Mono', monospace",
            }}
          >
            TONY
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] md:text-[11px] font-mono tracking-[0.3em] text-[var(--color-text-dim)]">
            <span className="text-[var(--color-text)]">AI TRADING BOT</span>
            <span>·</span>
            <span className="text-[var(--color-text)]">n8n AUTOMATION</span>
          </div>

          <p className="mt-4 text-[12px] md:text-[13px] text-[var(--color-text-dim)] leading-relaxed max-w-xl">
            Sistema operativo de trading autónomo. Analiza, ejecuta y optimiza estrategias 24/7
            con <span className="text-[var(--color-green)] font-semibold">7 agentes especializados</span>,
            <span className="text-[var(--color-green)] font-semibold"> {stats.tools_total || 22} herramientas</span> y
            <span className="text-[var(--color-green)] font-semibold"> plan-and-act multi-step</span>.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/agents"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-[var(--color-green)]/15 border border-[var(--color-green)] text-[var(--color-green)] hover:bg-[var(--color-green)]/30 transition-colors"
            >
              <Play size={13} fill="currentColor" />
              <span className="text-[10px] tracking-[0.25em] font-mono font-semibold">IR AL DASHBOARD</span>
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-green)] hover:border-[var(--color-green)]/40 transition-colors"
            >
              <Settings size={13} />
              <span className="text-[10px] tracking-[0.25em] font-mono">CONFIGURAR BOT</span>
            </Link>
          </div>
        </div>

        {/* Footer status line */}
        <div className="mt-6 flex items-center gap-3 text-[10px] font-mono tracking-[0.25em]">
          <span className="flex items-center gap-2 text-[var(--color-green)]">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-[var(--color-green)] animate-ping opacity-50" />
              <span className="relative w-2 h-2 rounded-full bg-[var(--color-green)] glow-green" />
            </span>
            SISTEMA ACTIVO
          </span>
          <span className="text-[var(--color-text-dim)]">·</span>
          <span className="text-[var(--color-text-dim)]">
            Conectado a n8n · {stats.n8n_active || "—"} nodos
          </span>
        </div>
      </div>
    </div>
  );
}

function Telemetry({
  label, value, tone = "default",
}: { label: string; value: string; tone?: "default" | "green" | "amber" | "red" }) {
  const colorClass = {
    default: "text-[var(--color-text)]",
    green: "text-[var(--color-green)]",
    amber: "text-[var(--color-amber)]",
    red: "text-[var(--color-red)]",
  }[tone];
  return (
    <div className="flex flex-col items-end">
      <span className="text-[8px] tracking-[0.25em] text-[var(--color-text-dim)] font-mono">{label}</span>
      <span className={`text-sm md:text-base font-bold font-mono tabular-nums ${colorClass}`}>{value}</span>
    </div>
  );
}

/** Animated wireframe globe SVG (background decoration). */
function GlobeWireframe() {
  return (
    <svg viewBox="0 0 280 280" className="w-full h-full">
      <defs>
        <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(72,255,128,0.20)" />
          <stop offset="70%" stopColor="rgba(72,255,128,0.05)" />
          <stop offset="100%" stopColor="rgba(72,255,128,0)" />
        </radialGradient>
      </defs>
      <circle cx="140" cy="140" r="130" fill="url(#globeGlow)" />
      <circle cx="140" cy="140" r="120" fill="none" stroke="rgba(72,255,128,0.30)" strokeWidth="1" />
      <circle cx="140" cy="140" r="90" fill="none" stroke="rgba(72,255,128,0.20)" strokeWidth="0.7" />
      <circle cx="140" cy="140" r="60" fill="none" stroke="rgba(72,255,128,0.15)" strokeWidth="0.5" />
      {/* Latitude lines (ellipses) */}
      {[15, 35, 55, 75, 95].map((ry, i) => (
        <ellipse
          key={i}
          cx="140"
          cy="140"
          rx="120"
          ry={ry}
          fill="none"
          stroke={`rgba(72,255,128,${0.10 + i * 0.03})`}
          strokeWidth="0.5"
        />
      ))}
      {/* Longitude lines */}
      {[20, 40, 60, 80, 100, 120].map((rx, i) => (
        <ellipse
          key={i}
          cx="140"
          cy="140"
          rx={rx}
          ry="120"
          fill="none"
          stroke={`rgba(72,255,128,${0.10 + i * 0.03})`}
          strokeWidth="0.5"
        />
      ))}
      {/* Vertical axis */}
      <line x1="140" y1="20" x2="140" y2="260" stroke="rgba(72,255,128,0.25)" strokeWidth="0.7" />
      {/* Slow rotation animation */}
      <g style={{ animation: "spin 30s linear infinite", transformOrigin: "140px 140px" }}>
        <ellipse cx="140" cy="140" rx="120" ry="40" fill="none" stroke="rgba(72,255,128,0.4)" strokeWidth="1" strokeDasharray="2 4" />
      </g>
      {/* Highlight dots */}
      <circle cx="180" cy="100" r="2" fill="rgba(72,255,128,0.9)" />
      <circle cx="100" cy="160" r="2" fill="rgba(72,255,128,0.7)" />
      <circle cx="200" cy="180" r="1.5" fill="rgba(72,255,128,0.6)" />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
