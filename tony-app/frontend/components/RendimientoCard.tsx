"use client";
import { useEffect, useMemo, useState } from "react";
import { api, fmt } from "@/lib/api";

const TF: { key: "24H" | "7D" | "30D" | "90D"; label: string; rows: number }[] = [
  { key: "24H", label: "24H", rows: 24 },
  { key: "7D", label: "7D", rows: 7 },
  { key: "30D", label: "30D", rows: 30 },
  { key: "90D", label: "90D", rows: 90 },
];

/**
 * RENDIMIENTO card (Claude Design):
 *  - Tabs 24H / 7D / 30D / 90D
 *  - Big area chart (green gradient fill)
 *  - 4 KPIs: DRAWDOWN / SHARPE RATIO / PROFIT FACTOR / WIN RATE
 */
export function RendimientoCard() {
  const [perf, setPerf] = useState<any>(null);
  const [tf, setTf] = useState<"24H" | "7D" | "30D" | "90D">("24H");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const p = await api.perfHistory();
        if (mounted) setPerf(p);
      } catch {}
    }
    load();
    const i = setInterval(load, 60000);
    return () => { mounted = false; clearInterval(i); };
  }, []);

  const rows: any[] = perf?.rows || [];
  const sliced = useMemo(() => {
    const tfDef = TF.find((t) => t.key === tf) || TF[0];
    return rows.slice(-tfDef.rows);
  }, [rows, tf]);

  const values = sliced.map((r: any) => Number(r.real_money_value ?? r.moomoo_value ?? r.combined_value ?? r.combined ?? r.value ?? 0));
  const minV = values.length ? Math.min(...values) : 0;
  const maxV = values.length ? Math.max(...values) : 0;

  // Calc metrics from full history
  const metrics = useMemo(() => {
    if (rows.length < 2) {
      return { drawdown: 0, sharpe: 0, profitFactor: 0, winRate: 0 };
    }
    const allValues = rows.map((r: any) => Number(r.real_money_value ?? r.moomoo_value ?? r.combined_value ?? r.combined ?? r.value ?? 0));
    const returns: number[] = [];
    for (let i = 1; i < allValues.length; i++) {
      const ret = allValues[i - 1] !== 0 ? (allValues[i] - allValues[i - 1]) / allValues[i - 1] : 0;
      returns.push(ret);
    }
    const mean = returns.reduce((s, r) => s + r, 0) / Math.max(1, returns.length);
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / Math.max(1, returns.length);
    const std = Math.sqrt(variance);
    const sharpe = std ? (mean / std) * Math.sqrt(252) : 0;
    let peak = allValues[0];
    let maxDD = 0;
    for (const v of allValues) {
      if (v > peak) peak = v;
      const dd = peak ? (v - peak) / peak : 0;
      if (dd < maxDD) maxDD = dd;
    }
    const wins = returns.filter((r) => r > 0);
    const losses = returns.filter((r) => r < 0);
    const grossWin = wins.reduce((s, r) => s + r, 0);
    const grossLoss = Math.abs(losses.reduce((s, r) => s + r, 0));
    const profitFactor = grossLoss ? grossWin / grossLoss : grossWin > 0 ? 999 : 0;
    const winRate = returns.length ? (wins.length / returns.length) * 100 : 0;
    return {
      drawdown: maxDD * 100,
      sharpe,
      profitFactor: Math.min(profitFactor, 99),
      winRate,
    };
  }, [rows]);

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur p-5 h-full flex flex-col">
      {/* Header with timeframe tabs */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] tracking-[0.25em] font-mono text-[var(--color-text)] font-semibold">
          RENDIMIENTO
        </h3>
        <div className="flex items-center gap-1 bg-black/40 rounded-md p-0.5 border border-[var(--color-border)]">
          {TF.map((t) => (
            <button
              key={t.key}
              onClick={() => setTf(t.key)}
              className={`px-2.5 py-1 text-[9px] font-mono tracking-wider rounded transition-colors ${
                tf === t.key
                  ? "bg-[var(--color-green)]/15 text-[var(--color-green)] border border-[var(--color-green)]/40"
                  : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 relative min-h-[180px]">
        <AreaChart values={values} />
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-1 text-[8px] font-mono text-[var(--color-text-dim)] tabular-nums pointer-events-none">
          <span>{maxV ? Math.round(maxV / 1000) + "K" : "—"}</span>
          <span>{values.length ? Math.round((maxV + minV) / 2 / 1000) + "K" : ""}</span>
          <span>{minV ? Math.round(minV / 1000) + "K" : ""}</span>
        </div>
      </div>

      {/* Bottom KPI row */}
      <div className="grid grid-cols-4 gap-3 pt-4 mt-4 border-t border-[var(--color-border)]">
        <Stat label="DRAWDOWN" value={`${metrics.drawdown.toFixed(2)}%`} tone={metrics.drawdown < -10 ? "red" : "amber"} />
        <Stat label="SHARPE RATIO" value={metrics.sharpe.toFixed(2)} tone="default" />
        <Stat label="PROFIT FACTOR" value={metrics.profitFactor.toFixed(2)} tone={metrics.profitFactor > 1 ? "green" : "red"} />
        <Stat label="WIN RATE" value={`${metrics.winRate.toFixed(1)}%`} tone={metrics.winRate > 50 ? "green" : "amber"} />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "default" | "green" | "amber" | "red" }) {
  const color = {
    default: "text-[var(--color-text)]",
    green: "text-[var(--color-green)]",
    amber: "text-[var(--color-amber)]",
    red: "text-[var(--color-red)]",
  }[tone];
  return (
    <div className="flex flex-col">
      <span className="text-[8px] tracking-[0.25em] font-mono text-[var(--color-text-dim)]">{label}</span>
      <span className={`text-base font-bold font-mono tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

function AreaChart({ values }: { values: number[] }) {
  if (!values.length) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-[var(--color-text-dim)]">
        sin datos
      </div>
    );
  }
  const w = 600;
  const h = 200;
  const padX = 20;
  const padY = 10;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const pts = values.map((v, i) => {
    const x = padX + (i / Math.max(1, values.length - 1)) * innerW;
    const y = padY + innerH - ((v - min) / range) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = pts.join(" ");
  const area = `M ${padX},${padY + innerH} L ${pts.join(" L ")} L ${padX + innerW},${padY + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="rndGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(72,255,128,0.45)" />
          <stop offset="100%" stopColor="rgba(72,255,128,0)" />
        </linearGradient>
      </defs>
      {/* Horizontal grid lines */}
      {[0.25, 0.5, 0.75].map((p, i) => (
        <line
          key={i}
          x1={padX}
          x2={w - padX}
          y1={padY + innerH * p}
          y2={padY + innerH * p}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="0.5"
          strokeDasharray="3 4"
        />
      ))}
      <path d={area} fill="url(#rndGrad)" />
      <polyline points={line} fill="none" stroke="var(--color-green)" strokeWidth="2" />
    </svg>
  );
}
