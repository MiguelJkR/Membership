"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, MiniMetric } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Search, Loader2, Library, Plus, ExternalLink } from "lucide-react";

export default function ResearchPage() {
  const [list, setList] = useState<any>({});
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [ingestUrl, setIngestUrl] = useState("");
  const [ingesting, setIngesting] = useState(false);

  useEffect(() => { api.youtubeList().then(setList); }, []);

  async function search() {
    if (!query.trim() || searching) return;
    setSearching(true); setResult(null);
    const r = await api.youtubeQuery(query);
    // Output may be wrapped; try parse stdout
    let parsed = r;
    if ((r as any).stdout) {
      try {
        const txt = (r as any).stdout as string;
        const i = txt.indexOf("{");
        if (i >= 0) parsed = JSON.parse(txt.substring(i));
      } catch {}
    }
    setResult(parsed);
    setSearching(false);
  }

  async function ingest() {
    if (!ingestUrl.trim() || ingesting) return;
    setIngesting(true);
    const r = await api.youtubeIngest(ingestUrl);
    setIngesting(false);
    setIngestUrl("");
    api.youtubeList().then(setList);
    alert("Ingest completado: " + JSON.stringify(r).substring(0, 200));
  }

  const SAMPLE_QUERIES = [
    "EUR USD outlook próximas semanas",
    "Fed interest rate impact 2026",
    "supertrend strategy parameters",
    "ATR volatility forex",
    "NVDA forecast bull case",
  ];

  return (
    <div className="p-5 space-y-4">
      <PageHeader title="Research · YouTube RAG" subtitle="LOCAL VECTOR STORE · 384-DIM EMBEDDINGS · GROQ SYNTHESIS" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniMetric label="VIDEOS INDEXADOS" value={`${list.transcripts_count || 0}`} tone="cyan" />
        <MiniMetric label="EMBEDDING MODEL" value="MiniLM-L6" tone="green" />
        <MiniMetric label="DIM" value="384" />
        <MiniMetric label="STORE" value="chromadb" tone="amber" />
      </div>

      {/* Query interface */}
      <Card title="QUERY KNOWLEDGE BASE" glow="cyan">
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") search(); }}
            placeholder="¿Qué dice X sobre Y?"
            className="flex-1 px-4 py-2 bg-black/40 border border-[var(--color-border)] rounded text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-cyan)] font-mono"
          />
          <button
            onClick={search}
            disabled={searching || !query.trim()}
            className="px-4 py-2 rounded bg-[var(--color-cyan)]/20 border border-[var(--color-cyan)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/40 disabled:opacity-40 transition-colors flex items-center gap-2"
          >
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            <span className="text-[10px] tracking-widest font-mono">QUERY</span>
          </button>
        </div>

        {/* Sample queries */}
        <div className="flex flex-wrap gap-2 mb-3">
          {SAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => setQuery(q)}
              className="text-[9px] font-mono tracking-widest px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-cyan)] hover:border-[var(--color-cyan)]/40"
            >
              {q}
            </button>
          ))}
        </div>

        {result && (
          <div className="px-4 py-3 bg-black/60 rounded border border-[var(--color-cyan)]/40">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] tracking-widest text-[var(--color-cyan)] font-mono">SYNTHESIS · {result.matches_count || 0} MATCHES</span>
            </div>
            <div className="text-[12px] text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">
              {result.synthesis || result.error || "(sin respuesta)"}
            </div>
            {result.sources && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                <div className="text-[8px] tracking-widest text-[var(--color-text-dim)] font-mono mb-1">SOURCES</div>
                {result.sources.map((s: any, i: number) => (
                  <div key={i} className="text-[10px] font-mono text-[var(--color-text-dim)]">
                    · video <span className="text-[var(--color-cyan)]">{s.video_id}</span> (sim {(s.similarity || 0).toFixed(3)})
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="VIDEOS INDEXADOS" glow="green">
          <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
            {(list.video_ids || []).map((id: string) => (
              <a
                key={id}
                href={`https://www.youtube.com/watch?v=${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 bg-black/40 rounded border border-[var(--color-border)] hover:border-[var(--color-border-bright)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Library size={12} className="text-[var(--color-green)]" />
                  <span className="text-[10px] font-mono text-[var(--color-text)]">{id}</span>
                </div>
                <ExternalLink size={11} className="text-[var(--color-text-dim)]" />
              </a>
            ))}
            {!(list.video_ids || []).length && (
              <div className="text-[10px] text-[var(--color-text-dim)] py-4">Sin videos indexados</div>
            )}
          </div>
        </Card>

        <Card title="INGEST NEW VIDEO" glow="cyan">
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={ingestUrl}
              onChange={(e) => setIngestUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="px-4 py-2 bg-black/40 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-cyan)]"
            />
            <button
              onClick={ingest}
              disabled={ingesting || !ingestUrl.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded border border-[var(--color-cyan)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/10 disabled:opacity-40"
            >
              {ingesting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              <span className="text-[10px] tracking-widest font-mono">INGEST · ~30s</span>
            </button>
            <div className="text-[9px] text-[var(--color-text-dim)] font-mono mt-2">
              Pipeline: yt-dlp → auto-subs → chunk 400w/40 overlap → MiniLM-L6 embed → chromadb upsert
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
