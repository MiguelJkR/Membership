"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Play, Settings, Activity } from "lucide-react";

/**
 * Hero principal estilo Watch Dogs:
 * - Silueta de Tony a la izquierda con treatment cyberpunk (border glow)
 * - Título "TONY" grande con glow + subtítulo "AI TRADING BOT · n8n AUTOMATION"
 * - "● SISTEMA ACTIVO · Conectado a n8n · N nodos" arriba
 * - Tagline con counts reales (7 agentes · 22 tools · plan-and-act)
 * - 2 CTAs: "Ir al Dashboard" + "Configurar Bot"
 * - Telemetría vertical a la derecha: UPTIME / NODES / AGENTS / HEALTH
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
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, []);

  // Live uptime tick
  useEffect(() => {
    if (!stats.start_ts) return;
    const tick = () => setUptimeNow(Math.floor(Date.now() / 1000) - stats.start_ts);
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [stats.start_ts]);

  function fmtUptime(s: number): string {
    if (s < 0) return "—";
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-[var(--color-cyan)]/20 bg-gradient-to-br from-[var(--color-bg-card)] via-black/60 to-[var(--color-bg-card)]">
      {/* Background scanlines */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,229,255,0.5) 3px, transparent 4px)",
        }}
      />
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 30% 50%, rgba(0,229,255,0.08), transparent 60%)",
        }}
      />

      <div className="relative grid grid-cols-1 md:grid-cols-[280px_1fr_auto] gap-6 p-6 md:p-10 items-center min-h-[320px]">
        {/* LEFT — Tony silhouette */}
        <div className="relative w-full flex justify-center md:justify-start">
          <div className="relative w-44 h-56 md:w-56 md:h-64">
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-lg border-2 border-[var(--color-cyan)]/40 glow-cyan animate-pulse" />
            {/* Image with cyberpunk treatment */}
            <div className="absolute inset-0 rounded-lg overflow-hidden bg-black"
              style={{
                filter: "contrast(1.2) brightness(0.85) hue-rotate(-10deg)",
              }}
            >
              <Image
                src="/tony-character-1.png"
                alt="TONY · AI Operator"
                fill
                className="object-cover"
                style={{ mixBlendMode: "screen", opacity: 0.92 }}
                priority
              />
              {/* Cyan tint overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-cyan)]/10 via-transparent to-transparent" />
              {/* Bottom scanline */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-cyan)]/40 glow-cyan" />
            </div>
            {/* Corner brackets */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[var(--color-cyan)]" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[var(--color-cyan)]" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[var(--color-cyan)]" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[var(--color-cyan)]" />
          </div>
        </div>

        {/* CENTER — Title + tagline + CTAs */}
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Status line */}
          <div className="flex items-center gap-3 text-[10px] font-mono tracking-[0.25em]">
            <span className="flex items-center gap-1.5 text-[var(--color-green)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-green)] animate-pulse glow-green" />
              SISTEMA ACTIVO
            </span>
            <span className="text-[var(--color-text-dim)]">·</span>
            <span className="text-[var(--color-text-dim)]">
              Conectado a n8n · {stats.n8n_active || "—"} nodos
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-5xl md:text-7xl font-black tracking-tight text-[var(--color-cyan)] leading-none"
            style={{
              textShadow:
                "0 0 30px rgba(0,229,255,0.6), 0 0 60px rgba(0,229,255,0.3)",
              fontFamily: "'Consolas', 'SF Mono', monospace",
            }}
          >
            TONY
          </h1>

          {/* Subtitle */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-[11px] font-mono tracking-[0.2em] text-[var(--color-text-dim)]">
            <span className="text-[var(--color-text)]">AI TRADING BOT</span>
            <span>·</span>
            <span className="text-[var(--color-text)]">n8n AUTOMATION</span>
            <span>·</span>
            <span className="text-[var(--color-cyan)]">v2.0.1</span>
          </div>

          {/* Tagline */}
          <p className="text-[12px] md:text-[13px] text-[var(--color-text-dim)] max-w-2xl leading-relaxed">
            Sistema operativo de trading autónomo. Analiza, ejecuta y optimiza estrategias 24/7
            con <span className="text-[var(--color-cyan)] font-semibold">7 agentes especializados</span>,
            <span className="text-[var(--color-cyan)] font-semibold"> {stats.tools_total || 22} herramientas</span> y
            <span className="text-[var(--color-cyan)] font-semibold"> plan-and-act multi-step</span>.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-2 mt-2">
            <Link
              href="/agents"
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[var(--color-cyan)]/20 border border-[var(--color-cyan)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/40 transition-colors"
            >
              <Play size={14} fill="currentColor" />
              <span className="text-[10px] tracking-widest font-mono">IR AL AGENT</span>
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-cyan)] hover:border-[var(--color-cyan)]/40 transition-colors"
            >
              <Settings size={14} />
              <span className="text-[10px] tracking-widest font-mono">CONFIGURAR</span>
            </Link>
          </div>
        </div>

        {/* RIGHT — Vertical telemetry column */}
        <div className="hidden md:flex flex-col gap-3 min-w-[140px] border-l border-[var(--color-cyan)]/20 pl-4">
          <TelemetryRow label="UPTIME" value={fmtUptime(uptimeNow)} />
          <TelemetryRow
            label="NODES"
            value={`${stats.n8n_active || 0}/${stats.n8n_active || 0}`}
            tone="cyan"
          />
          <TelemetryRow label="AGENTS" value="7/7" tone="cyan" />
          <TelemetryRow
            label="HEALTH"
            value={stats.health !== undefined ? `${stats.health}%` : "—"}
            tone={
              stats.health >= 80 ? "green" : stats.health >= 60 ? "amber" : "red"
            }
          />
        </div>
      </div>
    </div>
  );
}

function TelemetryRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "cyan" | "green" | "amber" | "red";
}) {
  const colorClass = {
    default: "text-[var(--color-text)]",
    cyan: "text-[var(--color-cyan)]",
    green: "text-[var(--color-green)]",
    amber: "text-[var(--color-amber)]",
    red: "text-[var(--color-red)]",
  }[tone];

  return (
    <div className="flex flex-col">
      <span className="text-[8px] tracking-[0.25em] text-[var(--color-text-dim)] font-mono">
        {label}
      </span>
      <span className={`text-base font-bold font-mono tabular-nums ${colorClass}`}>{value}</span>
    </div>
  );
}
