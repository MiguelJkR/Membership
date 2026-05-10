"use client";
import { useEffect, useState } from "react";
import { api, fmt } from "@/lib/api";
import { Card, MiniMetric } from "@/components/Card";
import { PortfolioSparkline } from "@/components/PortfolioSparkline";
import { RiskGauge } from "@/components/RiskGauge";
import { AgentsList } from "@/components/AgentsList";
import { MatrixStream } from "@/components/MatrixStream";
import { TonyHero } from "@/components/TonyHero";
import { SystemStatusPanel } from "@/components/SystemStatusPanel";
import { Radar } from "@/components/Radar";

export default function Home() {
  const [data, setData] = useState<any>({});

  async function loadAll() {
    const [portfolio, perf, risk, vix, agents, health, notifications] = await Promise.all([
      api.portfolio(), api.perfHistory(), api.risk(), api.vix(), api.agents(), api.health(), api.notifications(),
    ]);
    setData({ portfolio, perf, risk, vix, agents, health, notifications });
  }

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 45000);
    return () => clearInterval(interval);
  }, []);

  const m = data.portfolio?.moomoo || {};
  const o = data.portfolio?.oanda || {};
  const realMoney = data.portfolio?.real_money_only || {};
  const pl = realMoney.total_pl ?? 0;

  return (
    <div className="p-5 space-y-4">
      {/* Hero principal estilo Watch Dogs */}
      <TonyHero />

      {/* Hero metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniMetric label="CAPITAL REAL" value={fmt(realMoney.total_value)} tone="cyan" />
        <MiniMetric label="GANANCIA NO REALIZADA" value={fmt(pl)} tone={pl >= 0 ? "green" : "red"} />
        <MiniMetric label="RIESGO" value={`${(data.risk?.total_score || 0).toFixed(0)}/100`} tone={data.risk?.total_score >= 65 ? "red" : data.risk?.total_score < 40 ? "green" : "amber"} />
        <MiniMetric label="SALUD SISTEMA" value={`${(data.health?.composite_score || 0).toFixed(0)}/100`} tone="green" />
      </div>

      {/* Top row: portfolio + risk + matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="PORTAFOLIO REAL" glow="green" scanline className="lg:col-span-2">
          <PortfolioSparkline rows={data.perf?.rows} series="combined" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            <MiniMetric label="MOOMOO" value={fmt(m.total_value)} tone="cyan" />
            <MiniMetric label="POSICIONES" value={`${m.positions_count || 0}`} />
            <MiniMetric label="NO REALIZADO" value={fmt(m.unrealized_pl)} tone={(m.unrealized_pl || 0) >= 0 ? "green" : "red"} />
            <MiniMetric label="REALIZADO" value={fmt(m.realized_pl)} tone={(m.realized_pl || 0) >= 0 ? "green" : "red"} />
          </div>
          {/* DEMO PAPER section */}
          <div className="mt-3 px-3 py-2 rounded border-l-2 border-[var(--color-amber)] bg-[var(--color-amber)]/5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono tracking-widest text-[var(--color-amber)]">CUENTA DEMO · OANDA</span>
              <span className="text-[8px] px-2 py-0.5 rounded border border-[var(--color-amber)] text-[var(--color-amber)] tracking-widest">SIN DINERO REAL</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-dim)] mt-1 font-mono">
              Capital virtual {fmt(o.total_value)} · G/P <span className={`${(o.total_pl || 0) >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]"}`}>{fmt(o.total_pl)}</span>
            </div>
          </div>
        </Card>
        <Card title="RIESGO COMPUESTO" glow="cyan">
          <RiskGauge score={data.risk?.total_score} label={data.risk?.label} />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <MiniMetric label="VIX" value={(data.vix?.vix || 0).toFixed(1)} tone="amber" />
            <MiniMetric label="RÉGIMEN" value={data.vix?.regime || "—"} />
          </div>
        </Card>
      </div>

      {/* Middle row: 4 columns (Tactical) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SystemStatusPanel />
        <Card title="ESCÁNER TÁCTICO" glow="cyan">
          <div className="flex flex-col items-center justify-center h-full py-2">
            <Radar size={200} showLabels />
            <div className="mt-2 text-[8px] tracking-widest font-mono text-[var(--color-text-dim)] text-center">
              SCAN ACTIVO · 4s SWEEP · OBJETIVOS EN TIEMPO REAL
            </div>
          </div>
        </Card>
        <Card title="MODO MATRIX" glow="green">
          <MatrixStream />
        </Card>
        <Card title="EVENTOS RECIENTES">
          <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
            {(data.notifications?.events || []).slice(-12).reverse().map((e: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-2 py-1.5 bg-black/30 rounded text-[10px] border border-[var(--color-border)]">
                <span className="text-[var(--color-text)] truncate">
                  {(e.event_type || "").toUpperCase()} {e.symbol || ""}
                </span>
                <span className="text-[var(--color-text-dim)] font-mono">{(e.timestamp_utc || "").substr(11, 8)}</span>
              </div>
            ))}
            {!data.notifications?.events?.length && (
              <div className="text-[10px] text-[var(--color-text-dim)] py-4">Sin eventos recientes</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
