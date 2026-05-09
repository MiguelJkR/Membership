"use client";
import { Card, MiniMetric } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { useEffect, useState } from "react";
import { api, fmt } from "@/lib/api";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>({});

  useEffect(() => {
    Promise.all([api.portfolio(), api.perfHistory()]).then(([portfolio, perf]) => setData({ portfolio, perf }));
  }, []);

  // Backtest static data from session
  const BACKTEST = {
    total_trades: 77,
    win_rate: 39.0,
    profit_factor: 1.68,
    avg_win: 153.92,
    avg_loss: -58.48,
    rr: 2.63,
    pnl: 1869.21,
    growth_pct: 4.67,
    drawdown: 3.0,
  };

  return (
    <div className="p-5 space-y-4">
      <PageHeader title="Analytics" subtitle="PERFORMANCE METRICS · INSTITUTIONAL · BACKTESTING" />

      <Card title="ACCOUNT PERFORMANCE" glow="green">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <MiniMetric label="WIN RATE" value="—" tone="cyan" />
          <MiniMetric label="PROFIT FACTOR" value="—" tone="cyan" />
          <MiniMetric label="SHARPE" value="—" tone="cyan" />
          <MiniMetric label="DRAWDOWN" value="—" tone="amber" />
          <MiniMetric label="TOTAL TRADES" value="—" />
          <MiniMetric label="EXPECTANCY" value="—" />
        </div>
        <div className="mt-3 text-[10px] text-[var(--color-text-dim)] font-mono">
          Account-level metrics aún no calculados — necesitan trade journal histórico. Brain Glia + journal pipeline pendiente.
        </div>
      </Card>

      <Card title="ML_SUPERTREND_BOT BACKTEST · 60D" glow="cyan">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <MiniMetric label="TRADES" value={`${BACKTEST.total_trades}`} tone="cyan" />
          <MiniMetric label="WIN RATE" value={`${BACKTEST.win_rate}%`} tone="amber" />
          <MiniMetric label="PROFIT FACTOR" value={BACKTEST.profit_factor.toFixed(2)} tone="green" />
          <MiniMetric label="R:R REALIZADO" value={BACKTEST.rr.toFixed(2)} tone="green" />
          <MiniMetric label="PNL TOTAL" value={fmt(BACKTEST.pnl)} tone="green" />
          <MiniMetric label="MAX DD" value={`${BACKTEST.drawdown}%`} tone="green" />
        </div>
        <div className="mt-3 px-3 py-2 bg-[var(--color-green)]/5 border-l-2 border-[var(--color-green)] rounded">
          <div className="text-[10px] tracking-widest text-[var(--color-green)] font-mono">VEREDICTO · EDGE POSITIVO</div>
          <div className="text-[11px] text-[var(--color-text-dim)] mt-1">
            39% win × R:R 2.63 = expectancy +$24.36/trade. Per-pair: EUR_USD ⭐ (50% win, +$1,155), GBP_USD (44%, +$394), XAU_USD (37.5%, +$324). USD_JPY drop (-$5).
            <br /><strong className="text-[var(--color-text)]">Plan jueves post-CPI:</strong> deploy demo con MTF filter relajado + 3 pairs (drop USD_JPY). Live $200-500 si sostenido.
          </div>
        </div>
      </Card>

      <Card title="EQUITY HISTORY" glow="green">
        <div className="text-[10px] text-[var(--color-text-dim)] font-mono">
          Histórico Moomoo + OANDA virtual. 50 puntos most recent.
        </div>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="text-[var(--color-text-dim)] tracking-widest">
                <th className="text-left px-2 py-1">TS</th>
                <th className="text-right px-2 py-1">REAL ($)</th>
                <th className="text-right px-2 py-1">DEMO ($)</th>
                <th className="text-right px-2 py-1">MOOMOO P/L</th>
                <th className="text-right px-2 py-1">OANDA P/L</th>
              </tr>
            </thead>
            <tbody>
              {(data.perf?.rows || []).slice(-15).reverse().map((r: any, i: number) => (
                <tr key={i} className="border-t border-[var(--color-border)] hover:bg-black/40">
                  <td className="px-2 py-1 text-[var(--color-text-dim)]">{r.ts}</td>
                  <td className="px-2 py-1 text-right text-[var(--color-cyan)]">{fmt(r.real_money_value)}</td>
                  <td className="px-2 py-1 text-right text-[var(--color-amber)]">{fmt(r.oanda_value)}</td>
                  <td className={`px-2 py-1 text-right ${(r.moomoo_pl || 0) >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]"}`}>{fmt(r.moomoo_pl)}</td>
                  <td className={`px-2 py-1 text-right ${(r.oanda_pl || 0) >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]"}`}>{fmt(r.oanda_pl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
