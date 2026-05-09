"use client";
import { useEffect, useRef } from "react";

/**
 * TradingView Ticker Tape — free embed, real-time prices for portfolio tickers.
 * Loads tradingview script lazily on mount.
 */
export function TickerTape() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || ref.current.querySelector("iframe")) return;
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { description: "AAL", proName: "NASDAQ:AAL" },
        { description: "NVDA", proName: "NASDAQ:NVDA" },
        { description: "MSFT", proName: "NASDAQ:MSFT" },
        { description: "ONDS", proName: "NASDAQ:ONDS" },
        { description: "EUR/USD", proName: "FX_IDC:EURUSD" },
        { description: "GBP/USD", proName: "FX_IDC:GBPUSD" },
        { description: "BTC", proName: "BITSTAMP:BTCUSD" },
        { description: "S&P", proName: "FOREXCOM:SPXUSD" },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "regular",
      colorTheme: "dark",
      locale: "es",
    });
    ref.current.appendChild(script);
  }, []);

  return (
    <div className="border-t border-[var(--color-border)] bg-black/30 overflow-hidden">
      <div ref={ref} className="tradingview-widget-container" style={{ height: 38 }} />
    </div>
  );
}
