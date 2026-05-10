"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/**
 * Live Ticker (Claude Design match):
 *  - "● LIVE" pulsing indicator
 *  - Horizontal flat list (no cards): SYMBOL price ±change ±pct
 *  - Smooth marquee scroll on overflow
 */
export function LiveTicker() {
  const [items, setItems] = useState<TickItem[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const pf = await api.portfolio();
        const positions = (pf as any)?.moomoo?.positions || (pf as any)?.positions || [];
        // Build ticker items from positions; fallback to common symbols if none
        const out: TickItem[] = positions.slice(0, 10).map((p: any) => {
          const last = Number(p.last_price ?? p.market_price ?? p.price ?? 0);
          const cost = Number(p.cost_price ?? p.avg_price ?? 0);
          const change = last - cost;
          const pct = cost ? (change / cost) * 100 : 0;
          return {
            symbol: (p.symbol || "").toUpperCase().replace(".US", ""),
            price: last,
            change,
            pct,
          };
        }).filter((x: TickItem) => x.symbol && x.price > 0);

        if (out.length === 0) {
          // Default majors
          out.push(
            { symbol: "NVDA", price: 946.20, change: -3.98, pct: -0.42 },
            { symbol: "MSFT", price: 442.18, change: 3.80, pct: 0.86 },
            { symbol: "EUR/USD", price: 0.5231, change: 0.0060, pct: 1.15 },
            { symbol: "BNB/USDT", price: 598.21, change: 5.84, pct: 0.98 },
            { symbol: "PLTR", price: 27.84, change: 0.87, pct: 3.21 },
            { symbol: "BTC/USDT", price: 67892.45, change: 822.10, pct: 1.23 }
          );
        }
        if (mounted) setItems(out);
      } catch {}
    }
    load();
    const i = setInterval(load, 60000);
    return () => { mounted = false; clearInterval(i); };
  }, []);

  return (
    <div className="flex items-center gap-4 px-5 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg)]/40 overflow-hidden">
      {/* LIVE indicator */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="relative flex w-2 h-2">
          <span className="absolute inset-0 rounded-full bg-[var(--color-green)] animate-ping opacity-60" />
          <span className="relative w-2 h-2 rounded-full bg-[var(--color-green)] glow-green" />
        </span>
        <span className="text-[9px] tracking-[0.3em] font-mono text-[var(--color-green)] font-semibold">LIVE</span>
      </div>

      {/* Marquee scroll */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className="flex gap-8 animate-[ticker_45s_linear_infinite]"
          style={{ animation: items.length ? "ticker 45s linear infinite" : undefined }}
        >
          {[...items, ...items].map((it, i) => (
            <TickerItem key={i} {...it} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

interface TickItem {
  symbol: string;
  price: number;
  change: number;
  pct: number;
}

function TickerItem({ symbol, price, change, pct }: TickItem) {
  const isPos = change >= 0;
  const color = isPos ? "text-[var(--color-green)]" : "text-[var(--color-red)]";
  return (
    <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
      <span className="text-[var(--color-text)] font-semibold tracking-wider">{symbol}</span>
      <span className="text-[var(--color-text-dim)] tabular-nums">
        {price < 10 ? price.toFixed(4) : price < 1000 ? price.toFixed(2) : price.toFixed(0)}
      </span>
      <span className={`${color} tabular-nums`}>
        {isPos ? "+" : ""}{change.toFixed(2)}
      </span>
      <span className={`${color} tabular-nums`}>
        ({isPos ? "+" : ""}{pct.toFixed(2)}%)
      </span>
    </div>
  );
}
