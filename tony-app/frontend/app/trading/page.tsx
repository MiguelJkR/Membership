"use client";
import { useEffect, useState } from "react";
import { api, fmt } from "@/lib/api";
import { Card, MiniMetric } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";

export default function TradingPage() {
  const [data, setData] = useState<any>({});

  async function load() {
    const [trading, signals, portfolio] = await Promise.all([api.trading(), api.signals(), api.portfolio()]);
    setData({ trading, signals, portfolio });
  }

  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, []);

  const t = data.trading || {};
  const m = data.portfolio?.moomoo || {};
  const o = t.oanda || {};

  return (
    <div className="p-5 space-y-4">
      <PageHeader title="Trading Terminal" subtitle="MULTI-EXCHANGE · MOOMOO + OANDA · LIVE" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniMetric label="MOOMOO P/L" value={fmt(m.total_pl)} tone={(m.total_pl || 0) >= 0 ? "green" : "red"} />
        <MiniMetric label="OANDA P/L" value={fmt(t.oanda?.total_pl)} tone="amber" />
        <MiniMetric label="OPEN POS" value={`${(m.positions_count || 0) + (o.open_trades_count || 0)}`} />
        <MiniMetric label="PENDING SIGS" value={`${(data.signals?.signals || []).length}`} tone="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="MOOMOO POSITIONS · REAL $" glow="green">
          <div className="flex flex-col gap-1.5">
            {(t.moomoo_positions || []).map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-black/40 rounded border border-[var(--color-border)] hover:border-[var(--color-border-bright)]">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[var(--color-text)]">{p.symbol}</span>
                  <span className="text-[9px] font-mono text-[var(--color-text-dim)]">{p.shares} sh @ {p.avg_cost?.toFixed(2)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-sm font-mono ${(p.pnl_unrealized || 0) >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]"}`}>
                    {fmt(p.pnl_unrealized)}
                  </span>
                  <span className="text-[9px] font-mono text-[var(--color-text-dim)]">{((p.pnl_unrealized / (p.avg_cost * p.shares)) * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
            {!t.moomoo_positions?.length && <div className="text-[10px] text-[var(--color-text-dim)] py-4">Sin posiciones</div>}
          </div>
        </Card>

        <Card title="OANDA POSITIONS · DEMO" glow="cyan">
          <div className="mb-2 text-[9px] tracking-widest text-[var(--color-amber)] flex items-center gap-2">
            <span className="px-2 py-0.5 rounded border border-[var(--color-amber)]">SIN DINERO REAL</span>
            forex/crypto practice
          </div>
          <div className="flex flex-col gap-1.5">
            {(o.open_positions || []).map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[var(--color-text)]">{p.instrument}</span>
                  <span className="text-[9px] font-mono text-[var(--color-text-dim)]">{p.side?.toUpperCase()} {Math.abs(p.units || 0)} units</span>
                </div>
                <span className={`text-sm font-mono ${(p.unrealized_pl || 0) >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]"}`}>
                  {fmt(p.unrealized_pl)}
                </span>
              </div>
            ))}
            {!o.open_positions?.length && <div className="text-[10px] text-[var(--color-text-dim)] py-4">Sin posiciones</div>}
          </div>
        </Card>
      </div>

      <Card title="TRADINGVIEW LIVE CHART" glow="cyan">
        <iframe
          src="https://s.tradingview.com/widgetembed/?symbol=NASDAQ%3AAAL&interval=D&theme=dark&style=1&locale=en"
          className="w-full h-[420px] rounded border border-[var(--color-border)]"
          title="TradingView"
          allow="clipboard-write"
        />
      </Card>

      <Card title="PENDING SIGNALS · APPROVAL FLOW">
        <div className="flex flex-col gap-1.5">
          {(data.signals?.signals || []).map((s: any) => (
            <div key={s.id} className="flex items-center justify-between px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
              <span className="text-sm">
                <span className={`font-bold ${s.action === "BUY" ? "text-[var(--color-green)]" : "text-[var(--color-red)]"}`}>{s.action}</span>
                <span className="text-[var(--color-text)] ml-2">{s.shares} {s.symbol}</span>
                {s.price && <span className="text-[var(--color-text-dim)] ml-2">@ ${s.price}</span>}
              </span>
              <div className="flex gap-2">
                <button onClick={() => api.decideSignal(s.id, "approve")} className="px-3 py-1 rounded bg-[var(--color-green)]/20 text-[var(--color-green)] text-[10px] tracking-widest font-mono hover:bg-[var(--color-green)]/40 transition-colors">APROBAR</button>
                <button onClick={() => api.decideSignal(s.id, "reject")} className="px-3 py-1 rounded bg-[var(--color-red)]/20 text-[var(--color-red)] text-[10px] tracking-widest font-mono hover:bg-[var(--color-red)]/40 transition-colors">RECHAZAR</button>
              </div>
            </div>
          ))}
          {!(data.signals?.signals || []).length && <div className="text-[10px] text-[var(--color-text-dim)] py-4">Sin signals pending</div>}
        </div>
      </Card>
    </div>
  );
}
