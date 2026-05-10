"use client";
import { useEffect, useState } from "react";
import { api, fmt } from "@/lib/api";
import {
  TrendingUp, TrendingDown, ShieldCheck, Target,
} from "lucide-react";

type MoomooPosition = {
  symbol: string;
  name?: string;
  shares: number;
  avg_cost: number;
  market_value: number;
  pnl_unrealized: number;
  stop_loss?: number | null;
  stop_loss_note?: string | null;
  hold_strategy?: "long_term" | "tactical" | string;
};

type OandaPosition = {
  instrument: string;
  side?: string;
  units: number;
  avg_price?: number;
  unrealized_pl: number;
  pl_total?: number;
};

interface Props {
  position: MoomooPosition | OandaPosition;
  variant: "moomoo" | "oanda";
}

const SYMBOL_COLORS = [
  { bg: "bg-[var(--color-cyan)]/15", text: "text-[var(--color-cyan)]", glow: "glow-cyan" },
  { bg: "bg-[var(--color-green)]/15", text: "text-[var(--color-green)]", glow: "glow-green" },
  { bg: "bg-[var(--color-amber)]/15", text: "text-[var(--color-amber)]", glow: "" },
  { bg: "bg-purple-500/15", text: "text-purple-400", glow: "" },
  { bg: "bg-pink-500/15", text: "text-pink-400", glow: "" },
];

type Colors = typeof SYMBOL_COLORS[number];

/** Synthetic fallback if real history fails (linear ease cost→current with noise). */
function syntheticSparkline(cost: number, current: number, points = 30): number[] {
  if (!cost || !current) return [];
  const result: number[] = [];
  const range = current - cost;
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    const base = cost + range * ease;
    const noise = (Math.sin(i * 1.7) + Math.sin(i * 0.9 + 2.3)) * Math.abs(range) * 0.04;
    result.push(base + noise);
  }
  result[result.length - 1] = current;
  return result;
}

export function PositionDetailCard({ position, variant }: Props) {
  const symbol = (variant === "moomoo"
    ? (position as MoomooPosition).symbol
    : (position as OandaPosition).instrument
  ).toUpperCase();
  const initial = symbol.charAt(0) || "•";
  const colors = SYMBOL_COLORS[symbol.charCodeAt(0) % SYMBOL_COLORS.length];

  if (variant === "moomoo") {
    return (
      <MoomooCard
        position={position as MoomooPosition}
        colors={colors}
        initial={initial}
        symbol={symbol}
      />
    );
  }
  return (
    <OandaCard
      position={position as OandaPosition}
      colors={colors}
      initial={initial}
      symbol={symbol}
    />
  );
}

function MoomooCard({
  position: p, colors, initial, symbol,
}: { position: MoomooPosition; colors: Colors; initial: string; symbol: string }) {
  const currentPrice = p.market_value / Math.max(p.shares, 0.001);
  const totalCost = p.avg_cost * p.shares;
  const pnl = p.pnl_unrealized || 0;
  const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
  const isPos = pnl >= 0;

  // Real history fetch with synthetic fallback
  const [sparklineValues, setSparklineValues] = useState<number[]>(
    () => syntheticSparkline(p.avg_cost, currentPrice)
  );
  const [hasRealHistory, setHasRealHistory] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.symbolHistory(symbol, 30).then((r) => {
      if (cancelled || !r.ok || !r.points || r.points.length < 5) return;
      setSparklineValues(r.points.map((pt) => pt.close));
      setHasRealHistory(true);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [symbol]);

  const hasStop = typeof p.stop_loss === "number" && p.stop_loss > 0;
  const stopDistance = hasStop ? ((currentPrice - (p.stop_loss as number)) / currentPrice) * 100 : 0;
  const stopWarning = hasStop && stopDistance < 5;
  const stopCritical = hasStop && stopDistance < 2;

  return (
    <div
      className={`rounded-lg border ${
        isPos ? "border-[var(--color-green)]/30" : "border-[var(--color-red)]/30"
      } bg-[var(--color-bg-card)]/80 backdrop-blur p-4 hover:border-current transition-colors`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full ${colors.bg} ${colors.glow} flex items-center justify-center shrink-0`}>
          <span className={`text-base font-bold font-mono ${colors.text}`}>{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold font-mono text-[var(--color-text)]">{symbol}</span>
            {p.hold_strategy === "long_term" && (
              <span className="text-[7px] tracking-widest font-mono px-1.5 py-0.5 rounded bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/30 text-[var(--color-cyan)]">
                HOLD
              </span>
            )}
            {hasRealHistory && (
              <span className="text-[7px] tracking-widest font-mono text-[var(--color-green)]/70" title="Datos reales Yahoo Finance">
                ●LIVE
              </span>
            )}
          </div>
          <div className="text-[10px] font-mono text-[var(--color-text-dim)] truncate">
            {p.name || symbol}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-base font-bold font-mono tabular-nums ${
            isPos ? "text-[var(--color-green)]" : "text-[var(--color-red)]"
          }`}>
            {isPos ? "+" : ""}{fmt(pnl)}
          </div>
          <div className={`text-[10px] font-mono ${isPos ? "text-[var(--color-green)]" : "text-[var(--color-red)]"} opacity-70`}>
            {isPos ? "+" : ""}{pnlPct.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="mb-3">
        <Sparkline values={sparklineValues} positive={isPos} />
        <div className="flex items-center justify-between mt-1 text-[8px] font-mono text-[var(--color-text-dim)]">
          <span>cost ${p.avg_cost.toFixed(2)}</span>
          <span className={`${colors.text}`}>now ${currentPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Position info */}
      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mb-2">
        <div className="px-2 py-1.5 rounded bg-black/30">
          <div className="text-[7px] tracking-widest text-[var(--color-text-dim)]">SHARES</div>
          <div className="text-[var(--color-text)] tabular-nums">{p.shares}</div>
        </div>
        <div className="px-2 py-1.5 rounded bg-black/30">
          <div className="text-[7px] tracking-widest text-[var(--color-text-dim)]">VALUE</div>
          <div className="text-[var(--color-text)] tabular-nums">{fmt(p.market_value)}</div>
        </div>
      </div>

      {/* Stop loss */}
      {hasStop ? (
        <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between text-[8px] font-mono mb-1">
            <span className="flex items-center gap-1 text-[var(--color-text-dim)]">
              <Target size={9} /> STOP-LOSS
            </span>
            <span className={
              stopCritical ? "text-[var(--color-red)] font-bold animate-pulse" :
              stopWarning ? "text-[var(--color-amber)]" :
              "text-[var(--color-text-dim)]"
            }>
              ${(p.stop_loss as number).toFixed(2)} · {stopDistance.toFixed(1)}% away
            </span>
          </div>
          <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                stopCritical ? "bg-[var(--color-red)]" :
                stopWarning ? "bg-[var(--color-amber)]" :
                "bg-[var(--color-green)]"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, 100 - stopDistance))}%` }}
            />
          </div>
          {p.stop_loss_note && (
            <div className="text-[8px] font-mono text-[var(--color-text-dim)] italic mt-1 truncate" title={p.stop_loss_note}>
              {p.stop_loss_note}
            </div>
          )}
        </div>
      ) : p.stop_loss_note ? (
        <div className="mt-2 pt-2 border-t border-[var(--color-border)] flex items-center gap-1.5 text-[9px] font-mono text-[var(--color-cyan)]">
          <ShieldCheck size={10} />
          <span className="truncate" title={p.stop_loss_note}>{p.stop_loss_note}</span>
        </div>
      ) : null}
    </div>
  );
}

function OandaCard({
  position: o, colors, initial, symbol,
}: { position: OandaPosition; colors: Colors; initial: string; symbol: string }) {
  const pnl = o.unrealized_pl || 0;
  const isPos = pnl >= 0;
  const cost = o.avg_price || 0;
  const sideUpper = (o.side || "").toUpperCase();

  // Real forex history
  const [sparklineValues, setSparklineValues] = useState<number[]>([]);
  const [hasRealHistory, setHasRealHistory] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.symbolHistory(symbol, 30).then((r) => {
      if (cancelled || !r.ok || !r.points || r.points.length < 5) return;
      setSparklineValues(r.points.map((pt) => pt.close));
      setHasRealHistory(true);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [symbol]);

  return (
    <div
      className={`rounded-lg border ${
        isPos ? "border-[var(--color-green)]/30" : "border-[var(--color-red)]/30"
      } bg-[var(--color-bg-card)]/80 backdrop-blur p-4 hover:border-current transition-colors`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center shrink-0`}>
          <span className={`text-base font-bold font-mono ${colors.text}`}>{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold font-mono text-[var(--color-text)]">{symbol}</span>
            <span className="text-[7px] tracking-widest font-mono px-1.5 py-0.5 rounded bg-[var(--color-amber)]/10 border border-[var(--color-amber)]/30 text-[var(--color-amber)]">
              DEMO
            </span>
            {sideUpper && (
              <span className={`text-[7px] tracking-widest font-mono ${
                sideUpper === "LONG" ? "text-[var(--color-green)]" : "text-[var(--color-red)]"
              }`}>
                {sideUpper}
              </span>
            )}
            {hasRealHistory && (
              <span className="text-[7px] tracking-widest font-mono text-[var(--color-green)]/70">
                ●LIVE
              </span>
            )}
          </div>
          <div className="text-[10px] font-mono text-[var(--color-text-dim)]">
            {Math.abs(o.units)} units @ {cost.toFixed(5)}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-base font-bold font-mono tabular-nums ${
            isPos ? "text-[var(--color-green)]" : "text-[var(--color-red)]"
          }`}>
            {isPos ? "+" : ""}{fmt(pnl)}
          </div>
          {isPos ? (
            <TrendingUp size={11} className="text-[var(--color-green)] inline" />
          ) : (
            <TrendingDown size={11} className="text-[var(--color-red)] inline" />
          )}
        </div>
      </div>
      {sparklineValues.length > 0 && (
        <div>
          <Sparkline values={sparklineValues} positive={isPos} />
          {hasRealHistory && (
            <div className="text-[8px] font-mono text-[var(--color-text-dim)] mt-1 text-right">
              últimos 30d · Yahoo Finance
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Sparkline({ values, positive }: { values: number[]; positive: boolean }) {
  if (!values || values.length < 2) {
    return <div className="h-12 w-full bg-black/20 rounded" />;
  }
  const w = 100;
  const h = 40;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = pts.join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const stroke = positive ? "var(--color-green)" : "var(--color-red)";
  const fill = positive ? "rgba(72, 255, 128, 0.15)" : "rgba(255, 68, 68, 0.15)";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <polyline points={area} fill={fill} />
      <polyline points={line} fill="none" stroke={stroke} strokeWidth="1.2" />
      <circle
        cx={parseFloat(pts[pts.length - 1].split(",")[0])}
        cy={parseFloat(pts[pts.length - 1].split(",")[1])}
        r="1.6"
        fill={stroke}
      />
    </svg>
  );
}
