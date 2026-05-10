"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type TickerItem = {
  symbol: string;
  price?: number;
  change_pct?: number;
  prev_close?: number;
  source?: string;
  history?: number[];
};

const TRACKED_SYMBOLS = [
  "AAL", "NVDA", "MSFT", "ONDS",       // portfolio
  "JBLU", "INTC", "CRNC", "SOUN",      // watchlist
  "EURUSD=X", "GBPUSD=X",              // forex (yfinance format)
  "BTC-USD", "ETH-USD",                // crypto
  "^GSPC",                             // S&P 500
];

/**
 * TickerTape v2 — custom, sin TradingView embed.
 * Usa price_fetcher backend para datos reales + sparklines mini SVG.
 * Hover muestra detalle. Click navega al symbol detail.
 */
export function TickerTapeV2() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      // Portfolio positions con precio (cast loose porque api.portfolio shape no incluye watchlist)
      const pf = (await api.portfolio()) as any;
      const positions = pf?.moomoo?.positions || pf?.portfolio?.moomoo?.positions || [];

      // Watchlist
      const wl = pf?.watchlist || pf?.portfolio?.watchlist || [];

      // Build items from portfolio + watchlist
      const list: TickerItem[] = [];
      for (const p of positions) {
        if (!p.symbol) continue;
        const cur = p.market_value && p.shares ? p.market_value / p.shares : undefined;
        const avg = p.avg_cost;
        const change_pct = cur && avg ? ((cur - avg) / avg) * 100 : undefined;
        list.push({
          symbol: p.symbol,
          price: cur ? parseFloat(cur.toFixed(2)) : undefined,
          change_pct: change_pct ? parseFloat(change_pct.toFixed(2)) : undefined,
          prev_close: avg,
          source: "portfolio",
        });
      }
      for (const w of wl) {
        if (!w.symbol || list.find((it) => it.symbol === w.symbol)) continue;
        list.push({
          symbol: w.symbol,
          price: w.last_price,
          source: "watchlist",
        });
      }

      // Get perf_history (real money equity curve) and use last 20 points as sparkline for "PORTFOLIO"
      const perf = await api.perfHistory();
      if (perf?.rows && perf.rows.length > 0) {
        const recent = perf.rows.slice(-20);
        const prices = recent.map((r: any) => r.real_money_value || r.combined_value || 0).filter((v: number) => v > 0);
        if (prices.length >= 2) {
          const first = prices[0];
          const last = prices[prices.length - 1];
          const pct = ((last - first) / first) * 100;
          list.unshift({
            symbol: "PORTFOLIO",
            price: parseFloat(last.toFixed(2)),
            change_pct: parseFloat(pct.toFixed(2)),
            history: prices,
            source: "tony",
          });
        }
      }

      setItems(list);
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const i = setInterval(load, 60000);
    return () => clearInterval(i);
  }, []);

  if (loading) {
    return (
      <div className="border-t border-[var(--color-border)] bg-black/30">
        <div className="h-10 flex items-center justify-center">
          <span className="text-[10px] tracking-widest font-mono text-[var(--color-text-dim)]">
            CARGANDO TICKER...
          </span>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  // Duplicate to enable seamless scroll
  const scrolling = [...items, ...items];

  return (
    <div className="border-t border-b border-[var(--color-border)] bg-black/40 overflow-hidden">
      <div className="ticker-scroll flex gap-6 py-2 whitespace-nowrap">
        {scrolling.map((item, i) => (
          <TickerItem key={`${item.symbol}-${i}`} item={item} />
        ))}
      </div>
      <style jsx>{`
        .ticker-scroll {
          animation: ticker-scroll 90s linear infinite;
        }
        .ticker-scroll:hover {
          animation-play-state: paused;
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function TickerItem({ item }: { item: TickerItem }) {
  const change = item.change_pct ?? 0;
  const isUp = change > 0;
  const isDown = change < 0;
  const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const colorClass = isUp
    ? "text-[var(--color-green)]"
    : isDown
    ? "text-[var(--color-red)]"
    : "text-[var(--color-text-dim)]";

  return (
    <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
      <span className="text-[var(--color-text)] font-semibold">{item.symbol}</span>
      {item.price !== undefined && (
        <span className="text-[var(--color-text-dim)]">${item.price.toFixed(2)}</span>
      )}
      {item.change_pct !== undefined && (
        <span className={`flex items-center gap-0.5 ${colorClass}`}>
          <TrendIcon size={9} strokeWidth={2.5} />
          {isUp ? "+" : ""}{item.change_pct.toFixed(2)}%
        </span>
      )}
      {item.history && item.history.length >= 2 && (
        <Sparkline values={item.history} color={isUp ? "#4ade80" : isDown ? "#ef4444" : "#6b7d99"} />
      )}
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 60;
  const height = 18;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
        style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}
      />
    </svg>
  );
}
