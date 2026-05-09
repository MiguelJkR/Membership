"use client";
import { Card, MiniMetric } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Send, MessageSquare, Video, Hash, TrendingUp, AlertCircle } from "lucide-react";

const PLATFORMS = [
  { name: "Twitter / X", icon: Send, mentions: 247, sentiment: 0.32, accent: "cyan" },
  { name: "Reddit", icon: MessageSquare, mentions: 89, sentiment: -0.12, accent: "amber" },
  { name: "YouTube", icon: Video, mentions: 34, sentiment: 0.18, accent: "red" },
  { name: "Telegram", icon: Hash, mentions: 56, sentiment: 0.42, accent: "green" },
];

const TRENDING = [
  { ticker: "NVDA", mentions: 247, change: 0.32 },
  { ticker: "AAL", mentions: 89, change: -0.18 },
  { ticker: "BTC", mentions: 456, change: 0.41 },
  { ticker: "TSLA", mentions: 178, change: -0.05 },
  { ticker: "EURUSD", mentions: 34, change: 0.12 },
];

const FEAR_GREED = 47;

export default function SocialPage() {
  return (
    <div className="p-5 space-y-4">
      <PageHeader title="Inteligencia Social" subtitle="SENTIMIENTO MULTI-PLATAFORMA · ALERTAS WHALE · DETECCIÓN DE TENDENCIAS" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PLATFORMS.map((p) => (
          <Card key={p.name} className="text-center">
            <p.icon size={20} className="mx-auto text-[var(--color-cyan)] mb-2" />
            <div className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono">{p.name}</div>
            <div className="text-xl font-mono font-bold text-[var(--color-text)]">{p.mentions}</div>
            <div className={`text-[11px] font-mono ${p.sentiment >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]"}`}>
              {p.sentiment >= 0 ? "+" : ""}{(p.sentiment * 100).toFixed(0)}%
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="ÍNDICE MIEDO Y CODICIA" glow="cyan" className="lg:col-span-1">
          <div className="flex flex-col items-center py-4">
            <div className="text-5xl font-mono font-bold text-[var(--color-amber)]">{FEAR_GREED}</div>
            <div className="text-[10px] tracking-widest text-[var(--color-text-dim)] mt-2">NEUTRAL</div>
            <div className="w-full h-2 bg-black/60 rounded mt-4 overflow-hidden">
              <div className="h-full" style={{
                width: `${FEAR_GREED}%`,
                background: "linear-gradient(90deg, var(--color-red), var(--color-amber), var(--color-green))"
              }} />
            </div>
            <div className="flex justify-between w-full text-[8px] tracking-widest text-[var(--color-text-dim)] mt-1">
              <span>MIEDO</span><span>CODICIA</span>
            </div>
          </div>
        </Card>

        <Card title="TICKERS EN TENDENCIA" glow="green" className="lg:col-span-2">
          <div className="flex flex-col gap-1.5">
            {TRENDING.map((t) => (
              <div key={t.ticker} className="flex items-center justify-between px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <TrendingUp size={14} className="text-[var(--color-cyan)]" />
                  <span className="text-sm font-bold text-[var(--color-text)]">{t.ticker}</span>
                  <span className="text-[10px] font-mono text-[var(--color-text-dim)]">{t.mentions} menciones</span>
                </div>
                <span className={`text-[11px] font-mono ${t.change >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]"}`}>
                  {t.change >= 0 ? "+" : ""}{(t.change * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="ALERTAS WHALE" glow="cyan">
        <div className="flex items-start gap-2 p-3 bg-black/40 rounded border border-[var(--color-amber)]/40">
          <AlertCircle size={16} className="text-[var(--color-amber)] shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] tracking-widest text-[var(--color-amber)] font-mono">PLACEHOLDER · INTEGRACIÓN PENDIENTE</div>
            <div className="text-[11px] text-[var(--color-text-dim)] mt-1">
              Conectar a Whale Alert API + on-chain Etherscan/BSCscan + menciones trending Twitter. Salidas: transacciones grandes, walls de compra/venta, patrones de acumulación.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
