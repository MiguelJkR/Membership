"use client";
import { useEffect, useState } from "react";
import { api, fmt } from "@/lib/api";
import { MoreVertical } from "lucide-react";

/**
 * RESUMEN GENERAL card (Claude Design match):
 *  - CAPITAL TOTAL    $X    +Y% (24H)        with mini sparkline
 *  - GANANCIAS (7D)   $X    +Y%               with mini sparkline
 *  - OPERACIONES (24H) X    +Y                with mini sparkline
 *  - RIESGO ACTUAL    BAJO/MEDIO/ALTO  Y%     with mini sparkline
 */
export function ResumenGeneralCard() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [perf, setPerf] = useState<any>(null);
  const [risk, setRisk] = useState<any>(null);
  const [trades, setTrades] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [pf, pe, rk] = await Promise.all([
          api.portfolio(),
          api.perfHistory(),
          api.risk(),
        ]);
        if (!mounted) return;
        setPortfolio(pf);
        setPerf(pe);
        setRisk(rk);
        // Recent activity counts (broker fills + signals + trades, all-time + 24h)
        try {
          const noti = await api.notifications();
          const events = noti.events || [];
          const isTradeLike = (e: any) =>
            String(e.event_type || "").toLowerCase().match(/trade|fill|signal|broker/);
          const tradeEventsAll = events.filter(isTradeLike);
          const last24h = events.filter((e: any) => {
            const t = new Date(e.timestamp_utc || e.ts || 0).getTime();
            return Date.now() - t < 24 * 60 * 60 * 1000;
          });
          const tradeEvents24 = last24h.filter(isTradeLike);
          if (mounted) {
            setTrades({
              count_24h: tradeEvents24.length,
              count_total: tradeEventsAll.length,
              events_24h: last24h.length,
            });
          }
        } catch {}
      } catch {}
    }
    load();
    const i = setInterval(load, 45000);
    return () => { mounted = false; clearInterval(i); };
  }, []);

  const real = portfolio?.real_money_only || {};
  const totalCapital = real.total_value || 0;
  const totalPL = real.total_pl || 0;
  // % vs cost basis (NOT 24h delta — this is total unrealized)
  const totalPlPct = totalCapital ? (totalPL / Math.max(totalCapital - totalPL, 1)) * 100 : 0;

  // Real 24h delta from perf history rows (timestamp-aware)
  // Backend rows: { ts, combined_value, real_money_value, moomoo_value, oanda_value, moomoo_pl, oanda_pl }
  const rows = perf?.rows || [];
  // Use REAL MONEY value (no demo OANDA) — that's what the user actually cares about
  const valueAt = (row: any) =>
    Number(row?.real_money_value ?? row?.moomoo_value ?? row?.combined_value ?? row?.combined ?? row?.value ?? 0);

  let pl24h = 0;
  let pct24h = 0;
  if (rows.length >= 2) {
    const last = rows[rows.length - 1];
    const lv = valueAt(last);
    const lastTs = new Date(last.timestamp_utc || last.ts || last.date || 0).getTime();
    // Find row closest to 24h ago
    const target24 = lastTs - 24 * 60 * 60 * 1000;
    let ref24 = rows[0];
    for (const r of rows) {
      const t = new Date(r.timestamp_utc || r.ts || r.date || 0).getTime();
      if (t <= target24) ref24 = r;
      else break;
    }
    const rv = valueAt(ref24);
    if (rv > 0) {
      pl24h = lv - rv;
      pct24h = (pl24h / rv) * 100;
    }
  }
  // Fallback to total P&L if not enough history
  const showTotal = rows.length < 2 || pl24h === 0;
  const plDisplayValue = showTotal ? totalPL : pl24h;
  const plDisplayPct = showTotal ? totalPlPct : pct24h;
  const plDeltaLabel = showTotal ? "(TOTAL)" : "(24H)";

  // 7d delta — same logic but 7 days back
  let pl7d = 0;
  let pct7d = 0;
  if (rows.length >= 2) {
    const last = rows[rows.length - 1];
    const lv = valueAt(last);
    const lastTs = new Date(last.timestamp_utc || last.ts || last.date || 0).getTime();
    const target7 = lastTs - 7 * 24 * 60 * 60 * 1000;
    let ref7 = rows[0];
    for (const r of rows) {
      const t = new Date(r.timestamp_utc || r.ts || r.date || 0).getTime();
      if (t <= target7) ref7 = r;
      else break;
    }
    const rv = valueAt(ref7);
    if (rv > 0) {
      pl7d = lv - rv;
      pct7d = (pl7d / rv) * 100;
    }
  }

  // If no trades in 24h, fallback to all-time trade count to show meaningful number
  const tradesCount = (trades?.count_24h && trades.count_24h > 0) ? trades.count_24h : (trades?.count_total ?? 0);
  const tradesLabel = (trades?.count_24h && trades.count_24h > 0) ? "(24H)" : "(TOTAL)";
  const riskScore = risk?.total_score || 0;
  const riskLabel = riskScore < 30 ? "BAJO" : riskScore < 60 ? "MEDIO" : "ALTO";
  const riskColor =
    riskScore < 30
      ? "text-[var(--color-green)]"
      : riskScore < 60
      ? "text-[var(--color-amber)]"
      : "text-[var(--color-red)]";

  // Build sparklines from perf history (using same valueAt mapper)
  const buildSpark = (_idx: number) => {
    if (!rows.length) return [];
    return rows.slice(-30).map((r: any) => valueAt(r));
  };

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] tracking-[0.25em] font-mono text-[var(--color-text)] font-semibold">
          RESUMEN GENERAL
        </h3>
        <button className="text-[var(--color-text-dim)] hover:text-[var(--color-green)]">
          <MoreVertical size={14} />
        </button>
      </div>

      {/* KPI rows */}
      <div className="space-y-4 flex-1">
        <KPI
          label="CAPITAL TOTAL"
          value={fmt(totalCapital)}
          delta={`${plDisplayPct >= 0 ? "+" : ""}${plDisplayPct.toFixed(2)}%`}
          deltaLabel={plDeltaLabel}
          unit="USD"
          spark={buildSpark(0)}
          tone={plDisplayValue >= 0 ? "green" : "red"}
        />
        <KPI
          label="GANANCIAS (7D)"
          value={fmt(pl7d)}
          delta={`${pct7d >= 0 ? "+" : ""}${pct7d.toFixed(2)}%`}
          spark={buildSpark(1)}
          tone={pl7d >= 0 ? "green" : "red"}
        />
        <KPI
          label="OPERACIONES"
          value={`${tradesCount}`}
          delta={trades?.events_24h ? `${trades.events_24h} eventos hoy` : "Sin actividad hoy"}
          deltaLabel={tradesLabel}
          spark={buildSpark(2)}
          tone="cyan"
        />
        <div className="flex items-center justify-between gap-3 pt-1">
          <div>
            <div className="text-[8px] tracking-[0.3em] font-mono text-[var(--color-text-dim)]">RIESGO ACTUAL</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-base font-bold tracking-wider ${riskColor}`}>{riskLabel}</span>
              <span className="text-[10px] font-mono text-[var(--color-text-dim)]">{riskScore.toFixed(1)}%</span>
            </div>
          </div>
          <RiskBar score={riskScore} />
        </div>
      </div>
    </div>
  );
}

function KPI({
  label, value, delta, deltaLabel, unit, spark, tone,
}: {
  label: string;
  value: string;
  delta: string;
  deltaLabel?: string;
  unit?: string;
  spark: number[];
  tone: "green" | "red" | "cyan";
}) {
  const color =
    tone === "green"
      ? "text-[var(--color-green)]"
      : tone === "red"
      ? "text-[var(--color-red)]"
      : "text-[var(--color-cyan)]";
  const stroke =
    tone === "green"
      ? "var(--color-green)"
      : tone === "red"
      ? "var(--color-red)"
      : "var(--color-cyan)";

  return (
    <div className="flex items-end justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-[8px] tracking-[0.3em] font-mono text-[var(--color-text-dim)]">{label}</div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-base md:text-lg font-bold text-[var(--color-text)] font-mono">{value}</span>
          {unit && <span className="text-[9px] font-mono text-[var(--color-text-dim)]">{unit}</span>}
        </div>
        <div className={`text-[10px] font-mono ${color}`}>
          {delta} {deltaLabel && <span className="text-[var(--color-text-dim)]">{deltaLabel}</span>}
        </div>
      </div>
      <Sparkline values={spark} stroke={stroke} />
    </div>
  );
}

function Sparkline({ values, stroke }: { values: number[]; stroke: string }) {
  if (!values || values.length < 2) {
    return <div className="w-20 h-10 opacity-30 border-b border-dashed border-current" />;
  }
  const w = 80;
  const h = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="opacity-80 shrink-0">
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.5" />
      <polyline
        points={`0,${h} ${pts} ${w},${h}`}
        fill={stroke}
        opacity="0.12"
      />
    </svg>
  );
}

function RiskBar({ score }: { score: number }) {
  // 5-bar meter, fill proportional to score
  const filled = Math.min(5, Math.max(0, Math.round((score / 100) * 5)));
  const tone =
    score < 30 ? "var(--color-green)" : score < 60 ? "var(--color-amber)" : "var(--color-red)";
  return (
    <div className="flex items-end gap-0.5 h-8">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="w-1.5 rounded-sm"
          style={{
            height: `${20 + i * 4}%`,
            backgroundColor: i < filled ? tone : "rgba(255,255,255,0.10)",
          }}
        />
      ))}
    </div>
  );
}
