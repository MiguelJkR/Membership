"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";

const TICKERS = ["AAL", "NVDA", "MSFT", "ONDS"];

function SentimentBadge({ score }: { score?: number }) {
  if (score === undefined || score === null) return null;
  const tone = score > 0.1 ? "green" : score < -0.1 ? "red" : "amber";
  const label = score > 0.1 ? "BULL" : score < -0.1 ? "BEAR" : "NEUTRAL";
  const Icon = score > 0.1 ? TrendingUp : score < -0.1 ? TrendingDown : Minus;
  const colorMap: Record<string, string> = {
    green: "text-[var(--color-green)] border-[var(--color-green)]/40",
    red: "text-[var(--color-red)] border-[var(--color-red)]/40",
    amber: "text-[var(--color-amber)] border-[var(--color-amber)]/40",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[8px] tracking-widest font-mono ${colorMap[tone]}`}>
      <Icon size={9} />{label} {(score * 100).toFixed(0)}
    </span>
  );
}

export default function NewsPage() {
  const [data, setData] = useState<any>({});
  const [active, setActive] = useState<string>("ALL");

  useEffect(() => {
    api.news().then(setData);
    const t = setInterval(() => api.news().then(setData), 600000);
    return () => clearInterval(t);
  }, []);

  const tickerData = data.tickers || {};
  const tickersToShow = active === "ALL" ? TICKERS : [active];

  return (
    <div className="p-5 space-y-4">
      <PageHeader title="News Feed" subtitle="PORTFOLIO TICKERS · MULTI-SOURCE · SENTIMENT-SCORED" />

      {/* Ticker filter */}
      <div className="flex flex-wrap gap-2">
        {["ALL", ...TICKERS].map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-3 py-1.5 rounded text-[10px] tracking-widest font-mono border transition-colors ${
              active === t
                ? "border-[var(--color-cyan)] text-[var(--color-cyan)] bg-[var(--color-cyan)]/10"
                : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className={`grid gap-4 ${active === "ALL" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {tickersToShow.map((ticker) => {
          const tdata = tickerData[ticker] || {};
          const articles = tdata.articles || tdata.news || [];
          const overallSentiment = tdata.sentiment_score ?? tdata.overall_sentiment;
          return (
            <Card key={ticker} title={`${ticker} · ${articles.length} ARTICLES`} glow="cyan" action={<SentimentBadge score={overallSentiment} />}>
              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                {articles.length > 0 ? articles.map((a: any, i: number) => (
                  <a
                    key={i}
                    href={a.url || a.link || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 bg-black/40 rounded border border-[var(--color-border)] hover:border-[var(--color-border-bright)] transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-[var(--color-text)] line-clamp-2 group-hover:text-[var(--color-cyan)]">
                          {a.title || a.headline}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-[var(--color-text-dim)]">
                          <Newspaper size={10} />
                          <span className="truncate">{a.source || a.publisher || "—"}</span>
                          {(a.published_at || a.date) && <span>· {String(a.published_at || a.date).substr(0, 10)}</span>}
                        </div>
                        {a.summary && (
                          <div className="text-[10px] text-[var(--color-text-dim)] line-clamp-2 mt-1">{a.summary}</div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <SentimentBadge score={a.sentiment_score ?? a.sentiment} />
                        <ExternalLink size={11} className="text-[var(--color-text-dim)]" />
                      </div>
                    </div>
                  </a>
                )) : (
                  <div className="text-[10px] text-[var(--color-text-dim)] py-4">
                    {tdata.error ? `Error: ${tdata.error}` : "Sin artículos disponibles"}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
