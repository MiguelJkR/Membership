"use client";
import { useEffect, useState } from "react";
import { api, fmt } from "@/lib/api";
import { TrendingUp, TrendingDown, CheckCircle2, XCircle, MoreVertical, Activity } from "lucide-react";
import { PositionDetailCard } from "@/components/PositionDetailCard";

export default function TradingPage() {
  const [data, setData] = useState<any>({});

  async function load() {
    const [trading, signals, portfolio] = await Promise.all([
      api.trading(), api.signals(), api.portfolio()
    ]);
    setData({ trading, signals, portfolio });
  }

  useEffect(() => {
    load();
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  }, []);

  const t = data.trading || {};
  const m = data.portfolio?.moomoo || {};
  const o = t.oanda || {};
  const signals = data.signals?.signals || [];
  const moomooPositions = t.moomoo_positions || [];
  const oandaPositions = o.open_positions || [];
  const totalPositions = (m.positions_count || moomooPositions.length || 0) + (oandaPositions.length || 0);

  return (
    <div className="p-4 md:p-5 space-y-4">
      {/* Top KPI strip — same vocabulary as Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiPill
          label="G/P MOOMOO"
          value={fmt(m.total_pl)}
          tone={(m.total_pl || 0) >= 0 ? "green" : "red"}
          icon={(m.total_pl || 0) >= 0 ? TrendingUp : TrendingDown}
        />
        <KpiPill
          label="G/P OANDA"
          value={fmt(o.total_pl)}
          tone={(o.total_pl || 0) >= 0 ? "green" : "amber"}
          icon={Activity}
        />
        <KpiPill
          label="POSICIONES"
          value={`${totalPositions}`}
          tone="cyan"
        />
        <KpiPill
          label="SEÑALES PENDIENTES"
          value={`${signals.length}`}
          tone={signals.length ? "amber" : "cyan"}
        />
      </div>

      {/* Position detail cards — grid with sparklines + stop-loss bars */}
      {moomooPositions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] font-mono text-[var(--color-text-dim)]">
            <span className="text-[var(--color-green)]">●</span>
            POSICIONES MOOMOO · DINERO REAL · {moomooPositions.length} ACTIVAS
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {moomooPositions.map((p: any, i: number) => (
              <PositionDetailCard key={`m-${i}-${p.symbol}`} position={p} variant="moomoo" />
            ))}
          </div>
        </div>
      )}

      {oandaPositions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] font-mono text-[var(--color-text-dim)]">
            <span className="text-[var(--color-amber)]">●</span>
            POSICIONES OANDA · DEMO · {oandaPositions.length} ABIERTAS
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {oandaPositions.map((p: any, i: number) => (
              <PositionDetailCard key={`o-${i}-${p.instrument}`} position={p} variant="oanda" />
            ))}
          </div>
        </div>
      )}

      {moomooPositions.length === 0 && oandaPositions.length === 0 && (
        <Card title="SIN POSICIONES ABIERTAS">
          <div className="text-center py-8 text-[10px] font-mono text-[var(--color-text-dim)]">
            No hay posiciones activas. Cuando abras una, aparecerá aquí con sparkline + stop-loss bar.
          </div>
        </Card>
      )}

      {/* Row 2: TradingView embed */}
      <Card title="GRÁFICO EN VIVO · TRADINGVIEW">
        <iframe
          src="https://s.tradingview.com/widgetembed/?symbol=NASDAQ%3AAAL&interval=D&theme=dark&style=1&locale=es"
          className="w-full h-[420px] rounded border border-[var(--color-border)]/50"
          title="TradingView"
          allow="clipboard-write"
        />
      </Card>

      {/* Row 3: pending signals */}
      <Card title="SEÑALES PENDIENTES · APROBACIÓN MANUAL">
        <div className="space-y-2">
          {signals.length === 0 && (
            <div className="text-center py-6 text-[10px] font-mono text-[var(--color-text-dim)]">
              Sin señales pendientes
            </div>
          )}
          {signals.map((s: any) => (
            <SignalRow key={s.id} signal={s} onDecide={(d) => api.decideSignal(s.id, d).then(load)} />
          ))}
        </div>
      </Card>
    </div>
  );
}

/** ----- Reusable card matching the Dashboard visual language ----- */
function Card({
  title, badge, badgeTone, children,
}: {
  title: string;
  badge?: string;
  badgeTone?: "green" | "amber" | "red" | "cyan";
  children: React.ReactNode;
}) {
  const badgeColor = badge
    ? {
        green: "border-[var(--color-green)]/40 bg-[var(--color-green)]/10 text-[var(--color-green)]",
        amber: "border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10 text-[var(--color-amber)]",
        red: "border-[var(--color-red)]/40 bg-[var(--color-red)]/10 text-[var(--color-red)]",
        cyan: "border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]",
      }[badgeTone || "cyan"]
    : "";
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-[11px] tracking-[0.25em] font-mono text-[var(--color-text)] font-semibold">
            {title}
          </h3>
          {badge && (
            <span className={`text-[8px] tracking-widest font-mono px-2 py-0.5 rounded-full border ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        <button className="text-[var(--color-text-dim)] hover:text-[var(--color-green)]">
          <MoreVertical size={14} />
        </button>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function KpiPill({
  label, value, tone, icon: Icon,
}: {
  label: string;
  value: string;
  tone: "green" | "amber" | "red" | "cyan";
  icon?: any;
}) {
  const color = {
    green: "text-[var(--color-green)]",
    amber: "text-[var(--color-amber)]",
    red: "text-[var(--color-red)]",
    cyan: "text-[var(--color-cyan)]",
  }[tone];
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/60 backdrop-blur px-4 py-3">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[8px] tracking-[0.3em] font-mono text-[var(--color-text-dim)]">{label}</span>
        {Icon && <Icon size={12} className={color} />}
      </div>
      <div className={`text-base md:text-lg font-bold font-mono tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function PositionList({ items, variant }: { items: any[]; variant: "moomoo" | "oanda" }) {
  if (!items.length) {
    return (
      <div className="text-center py-8 text-[10px] font-mono text-[var(--color-text-dim)]">
        Sin posiciones abiertas
      </div>
    );
  }

  const colors = [
    { bg: "bg-[var(--color-cyan)]/15", text: "text-[var(--color-cyan)]" },
    { bg: "bg-[var(--color-green)]/15", text: "text-[var(--color-green)]" },
    { bg: "bg-[var(--color-amber)]/15", text: "text-[var(--color-amber)]" },
    { bg: "bg-purple-500/15", text: "text-purple-400" },
    { bg: "bg-pink-500/15", text: "text-pink-400" },
  ];

  return (
    <div className="space-y-2.5">
      {items.map((p: any, i: number) => {
        const symbol = (p.symbol || p.instrument || "").toString().toUpperCase();
        const initial = symbol.charAt(0) || "•";
        const c = colors[symbol.charCodeAt(0) % colors.length];

        const pnl = Number(
          variant === "moomoo" ? p.pnl_unrealized || 0 : p.unrealized_pl || 0
        );
        const isPos = pnl >= 0;
        const cost = Number(p.avg_cost || p.price || 0);
        const qty = Math.abs(Number(p.shares || p.units || 0));
        const pct = cost && qty ? (pnl / (cost * qty)) * 100 : 0;
        const subLabel =
          variant === "moomoo"
            ? `${qty} sh @ $${cost.toFixed(2)}`
            : `${(p.side || "").toUpperCase()} ${qty} units`;

        return (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2 rounded hover:bg-white/[0.02] border-l-2 border-transparent hover:border-[var(--color-green)]/40 transition-colors"
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center shrink-0`}>
              <span className={`text-[11px] font-bold font-mono ${c.text}`}>{initial}</span>
            </div>
            {/* Symbol + meta */}
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-[var(--color-text)] truncate">{symbol}</div>
              <div className="text-[9px] font-mono text-[var(--color-text-dim)]">{subLabel}</div>
            </div>
            {/* P/L */}
            <div className="text-right shrink-0">
              <div className={`text-[12px] font-mono font-semibold tabular-nums ${
                isPos ? "text-[var(--color-green)]" : "text-[var(--color-red)]"
              }`}>
                {isPos ? "+" : ""}{fmt(pnl)}
              </div>
              {pct !== 0 && (
                <div className={`text-[9px] font-mono tabular-nums ${
                  isPos ? "text-[var(--color-green)]" : "text-[var(--color-red)]"
                } opacity-70`}>
                  {isPos ? "+" : ""}{pct.toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SignalRow({ signal: s, onDecide }: { signal: any; onDecide: (d: "approve" | "reject") => void }) {
  const isBuy = s.action === "BUY";
  const isSell = s.action === "SELL";
  const actionColor = isBuy
    ? "text-[var(--color-green)] bg-[var(--color-green)]/10 border-[var(--color-green)]/40"
    : isSell
    ? "text-[var(--color-red)] bg-[var(--color-red)]/10 border-[var(--color-red)]/40"
    : "text-[var(--color-amber)] bg-[var(--color-amber)]/10 border-[var(--color-amber)]/40";

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded border border-[var(--color-border)] bg-black/30">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className={`text-[9px] tracking-widest font-mono font-bold px-2 py-1 rounded border ${actionColor}`}>
          {isBuy ? "COMPRAR" : isSell ? "VENDER" : s.action}
        </span>
        <span className="text-sm font-semibold text-[var(--color-text)] truncate">
          {s.shares} {s.symbol}
        </span>
        {s.price && (
          <span className="text-[10px] font-mono text-[var(--color-text-dim)] shrink-0">
            @ ${s.price}
          </span>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onDecide("approve")}
          className="flex items-center gap-1 px-3 py-1.5 rounded border border-[var(--color-green)]/40 bg-[var(--color-green)]/10 text-[var(--color-green)] text-[10px] tracking-widest font-mono hover:bg-[var(--color-green)]/25 transition"
        >
          <CheckCircle2 size={11} /> APROBAR
        </button>
        <button
          onClick={() => onDecide("reject")}
          className="flex items-center gap-1 px-3 py-1.5 rounded border border-[var(--color-red)]/40 bg-[var(--color-red)]/10 text-[var(--color-red)] text-[10px] tracking-widest font-mono hover:bg-[var(--color-red)]/25 transition"
        >
          <XCircle size={11} /> RECHAZAR
        </button>
      </div>
    </div>
  );
}
