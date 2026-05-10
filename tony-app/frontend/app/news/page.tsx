"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, MiniMetric } from "@/components/Card";
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw, Briefcase, Eye, DollarSign, Coins, BarChart3 } from "lucide-react";

function SentimentBadge({ score, label }: { score?: number; label?: string }) {
  if (score === undefined || score === null) return null;
  const tone = score > 0.15 ? "green" : score < -0.15 ? "red" : "amber";
  const Icon = score > 0.15 ? TrendingUp : score < -0.15 ? TrendingDown : Minus;
  const colorMap: Record<string, string> = {
    green: "text-[var(--color-green)] border-[var(--color-green)]/40",
    red: "text-[var(--color-red)] border-[var(--color-red)]/40",
    amber: "text-[var(--color-amber)] border-[var(--color-amber)]/40",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[8px] tracking-widest font-mono ${colorMap[tone]}`}>
      <Icon size={9} />{label || (score > 0 ? "BULL" : score < 0 ? "BEAR" : "NEUT")} {(score * 100).toFixed(0)}
    </span>
  );
}

const TYPE_ICONS: Record<string, any> = {
  position: Briefcase,
  watchlist: Eye,
  forex: DollarSign,
  crypto: Coins,
  commodity: Coins,
  index: BarChart3,
};

const TYPE_COLORS: Record<string, string> = {
  position: "text-[var(--color-green)]",
  watchlist: "text-[var(--color-cyan)]",
  forex: "text-[var(--color-amber)]",
  crypto: "text-orange-400",
  commodity: "text-yellow-400",
  index: "text-purple-400",
};

export default function NewsPage() {
  const [watchlist, setWatchlist] = useState<any>({});
  const [news, setNews] = useState<Record<string, any>>({});
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Load watchlist
  useEffect(() => { api.watchlist().then(setWatchlist); }, []);

  // Lazy-load news per ticker (avoid massive parallel fetches)
  async function loadNews(symbol: string) {
    if (news[symbol] || loading[symbol]) return;
    setLoading((l) => ({ ...l, [symbol]: true }));
    const r = await api.news(symbol);
    setNews((n) => ({ ...n, [symbol]: r }));
    setLoading((l) => ({ ...l, [symbol]: false }));
  }

  // Get all tickers grouped by type
  const allItems = [
    ...(watchlist.positions || []).map((p: any) => ({ ...p, type: "position" })),
    ...(watchlist.watchlist || []).map((w: any) => ({ ...w, type: "watchlist" })),
    ...(watchlist.forex || []),
    ...(watchlist.crypto || []),
    ...(watchlist.indices || []),
  ];

  const filtered = activeFilter === "all" ? allItems : allItems.filter((i: any) => i.type === activeFilter);
  const types = ["all", "position", "watchlist", "forex", "crypto", "index"];
  const typeCounts: Record<string, number> = {};
  allItems.forEach((i: any) => { typeCounts[i.type] = (typeCounts[i.type] || 0) + 1; });

  // Auto-load news for active symbol
  useEffect(() => { if (activeSymbol) loadNews(activeSymbol); }, [activeSymbol]);
  // Auto-load news for first 4 visible
  useEffect(() => {
    filtered.slice(0, 4).forEach((i: any) => loadNews(i.symbol));
  }, [activeFilter, watchlist.positions]);

  const activeData = activeSymbol ? news[activeSymbol] : null;

  return (
    <div className="p-4 md:p-5 space-y-4">
      {/* Subheader strip — Claude Design vocabulary */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/60 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-2">
          <Newspaper size={14} className="text-[var(--color-green)]" />
          <span className="text-[10px] tracking-[0.3em] font-mono text-[var(--color-text-dim)]">
            FEED MULTI-INSTRUMENTO · {watchlist.total_count || 0} TICKERS · POSICIONES + WATCHLIST + FOREX + CRYPTO + ÍNDICES
          </span>
        </div>
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-2">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setActiveFilter(t)}
            className={`px-3 py-1.5 rounded text-[10px] tracking-widest font-mono border transition-colors ${
              activeFilter === t
                ? "border-[var(--color-cyan)] text-[var(--color-cyan)] bg-[var(--color-cyan)]/10"
                : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
            }`}
          >
            {(t === "all" ? "TODOS" : t === "position" ? "POSICIONES" : t === "watchlist" ? "WATCHLIST" : t === "forex" ? "FOREX" : t === "crypto" ? "CRYPTO" : t === "index" ? "ÍNDICES" : t.toUpperCase())} {t !== "all" && `(${typeCounts[t] || 0})`}
            {t === "all" && `(${allItems.length})`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: ticker grid */}
        <div className="lg:col-span-5">
          <Card title={`${filtered.length} INSTRUMENTOS`} glow="cyan">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[70vh] overflow-y-auto">
              {filtered.map((item: any) => {
                const Icon = TYPE_ICONS[item.type] || Newspaper;
                const tickerNews = news[item.symbol];
                const isLoading = loading[item.symbol];
                const overall = tickerNews?.aggregate_sentiment;
                const isActive = activeSymbol === item.symbol;
                return (
                  <button
                    key={`${item.type}-${item.symbol}`}
                    onClick={() => setActiveSymbol(item.symbol)}
                    className={`flex flex-col items-start p-3 rounded border text-left transition-all ${
                      isActive
                        ? "border-[var(--color-cyan)] bg-[var(--color-cyan)]/10 glow-cyan"
                        : "border-[var(--color-border)] bg-black/40 hover:border-[var(--color-border-bright)]"
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Icon size={12} className={TYPE_COLORS[item.type] || "text-[var(--color-text-dim)]"} />
                      <span className="text-sm font-bold text-[var(--color-text)] flex-1">{item.symbol}</span>
                      {isLoading && <Loader2 size={10} className="animate-spin text-[var(--color-cyan)]" />}
                    </div>
                    {item.pnl !== undefined && (
                      <span className={`text-[10px] font-mono ${item.pnl >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]"}`}>
                        {item.pnl >= 0 ? "+" : ""}${item.pnl?.toFixed(0)}
                      </span>
                    )}
                    {item.alert_above && (
                      <span className="text-[9px] font-mono text-[var(--color-amber)]">→ ${item.alert_above}</span>
                    )}
                    {overall !== undefined && tickerNews?.ok && (
                      <div className="mt-1">
                        <SentimentBadge score={overall} label={tickerNews.label} />
                      </div>
                    )}
                    {tickerNews?.ok === false && !isLoading && (
                      <span className="text-[8px] text-[var(--color-red)] font-mono mt-1">ERR</span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right: news detail for active symbol */}
        <div className="lg:col-span-7">
          {activeSymbol && activeData ? (
            activeData.ok ? (
              <Card
                title={`${activeSymbol} · ${activeData.count} ARTÍCULOS`}
                glow="green"
                action={
                  <div className="flex items-center gap-2">
                    <SentimentBadge score={activeData.aggregate_sentiment} label={activeData.label} />
                    <button onClick={() => { setNews((n) => ({ ...n, [activeSymbol]: null })); loadNews(activeSymbol); }}
                            className="text-[var(--color-text-dim)] hover:text-[var(--color-cyan)]">
                      <RefreshCw size={12} />
                    </button>
                  </div>
                }
              >
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <MiniMetric label="ALCISTA" value={`${activeData.distribution?.bullish || 0}`} tone="green" />
                  <MiniMetric label="NEUTRAL" value={`${activeData.distribution?.neutral || 0}`} />
                  <MiniMetric label="BAJISTA" value={`${activeData.distribution?.bearish || 0}`} tone="red" />
                </div>
                <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto">
                  {(activeData.items || []).map((a: any, i: number) => (
                    <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                       className="block px-3 py-2 bg-black/40 rounded border border-[var(--color-border)] hover:border-[var(--color-border-bright)] transition-colors group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-[var(--color-text)] line-clamp-2 group-hover:text-[var(--color-cyan)]">
                            {a.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-[var(--color-text-dim)]">
                            <Newspaper size={10} />
                            <span>{a.publisher || "?"}</span>
                            {a.published && <span>· {String(a.published).substr(0, 10)}</span>}
                          </div>
                          {a.summary && (
                            <div className="text-[10px] text-[var(--color-text-dim)] line-clamp-2 mt-1">{a.summary}</div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <SentimentBadge score={a.sentiment_score} label={a.sentiment_label} />
                          <ExternalLink size={11} className="text-[var(--color-text-dim)]" />
                        </div>
                      </div>
                    </a>
                  ))}
                  {!(activeData.items || []).length && (
                    <div className="text-[10px] text-[var(--color-text-dim)] py-4">Sin artículos disponibles</div>
                  )}
                </div>
              </Card>
            ) : (
              <Card title={`${activeSymbol} · ERROR`} glow="cyan">
                <div className="text-[11px] text-[var(--color-red)] font-mono py-4">
                  {activeData.reason || activeData.error || "Sin datos disponibles"}
                </div>
                <div className="text-[9px] text-[var(--color-text-dim)] mt-2">
                  yfinance puede tardar en actualizar · Norton SSL puede bloquear · probá refrescar
                </div>
              </Card>
            )
          ) : (
            <Card title="SELECCIONAR INSTRUMENTO" glow="cyan">
              <div className="text-[11px] text-[var(--color-text-dim)] py-12 text-center">
                {!activeSymbol ? "Click en un instrumento de la izquierda para ver noticias + sentimiento" : "Cargando..."}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
