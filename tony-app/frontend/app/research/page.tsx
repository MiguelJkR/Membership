"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, MiniMetric } from "@/components/Card";
import { Search, Loader2, Library, Plus, ExternalLink, BookOpen } from "lucide-react";

export default function ResearchPage() {
  const [list, setList] = useState<any>({});
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [ingestUrl, setIngestUrl] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<{ ok: boolean; message: string; details?: any } | null>(null);

  useEffect(() => { api.youtubeList().then(setList); }, []);

  async function search() {
    if (!query.trim() || searching) return;
    setSearching(true); setResult(null);
    const r = await api.youtubeQuery(query);
    // safe_run returns parsed JSON directly
    setResult(r);
    setSearching(false);
  }

  async function ingest() {
    if (!ingestUrl.trim() || ingesting) return;
    setIngesting(true);
    setIngestStatus(null);
    const r: any = await api.youtubeIngest(ingestUrl);
    setIngesting(false);
    if (r.ok) {
      setIngestStatus({
        ok: true,
        message: `Video ${r.video_id} indexado correctamente`,
        details: r,
      });
      setIngestUrl("");
      api.youtubeList().then(setList);
    } else {
      setIngestStatus({
        ok: false,
        message: r.reason || r.error || "Error desconocido",
        details: r,
      });
    }
    // Auto-clear status after 8s
    setTimeout(() => setIngestStatus(null), 8000);
  }

  const SAMPLE_QUERIES = [
    "EUR USD outlook próximas semanas",
    "Fed interest rate impact 2026",
    "supertrend strategy parameters",
    "ATR volatility forex",
    "NVDA forecast bull case",
  ];

  return (
    <div className="p-4 md:p-5 space-y-4">
      {/* Subheader strip — Claude Design vocabulary */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/60 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-[var(--color-green)]" />
          <span className="text-[10px] tracking-[0.3em] font-mono text-[var(--color-text-dim)]">
            YOUTUBE RAG · VECTOR STORE LOCAL · EMBEDDINGS 384-DIM · SÍNTESIS GROQ
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniMetric label="VIDEOS INDEXADOS" value={`${list.transcripts_count || 0}`} tone="cyan" />
        <MiniMetric label="MODELO EMBEDDING" value="MiniLM-L6" tone="green" />
        <MiniMetric label="DIMENSIONES" value="384" />
        <MiniMetric label="ALMACÉN" value="chromadb" tone="amber" />
      </div>

      {/* Query interface */}
      <Card title="CONSULTAR BASE DE CONOCIMIENTO" glow="cyan">
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
            <span className="text-[10px] tracking-widest font-mono">CONSULTAR</span>
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
              <span className="text-[9px] tracking-widest text-[var(--color-cyan)] font-mono">SÍNTESIS · {result.matches_count || 0} COINCIDENCIAS</span>
            </div>
            <div className="text-[12px] text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">
              {result.synthesis || result.error || "(sin respuesta)"}
            </div>
            {result.sources && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                <div className="text-[8px] tracking-widest text-[var(--color-text-dim)] font-mono mb-1">FUENTES</div>
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
        <Card title="VIDEOS YA INDEXADOS" glow="green">
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

        <Card title="INDEXAR NUEVO VIDEO" glow="cyan">
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={ingestUrl}
              onChange={(e) => setIngestUrl(e.target.value)}
              placeholder="https://youtube.com/... (acepta /watch, /shorts, /live)"
              className="px-4 py-2 bg-black/40 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-cyan)]"
            />
            <button
              onClick={ingest}
              disabled={ingesting || !ingestUrl.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded border border-[var(--color-cyan)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/10 disabled:opacity-40"
            >
              {ingesting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              <span className="text-[10px] tracking-widest font-mono">{ingesting ? "INDEXANDO..." : "INDEXAR"}</span>
            </button>

            {/* Status feedback */}
            {ingestStatus && (
              <div className={`mt-2 px-3 py-2 rounded border-l-2 ${
                ingestStatus.ok
                  ? "border-[var(--color-green)] bg-[var(--color-green)]/5"
                  : "border-[var(--color-red)] bg-[var(--color-red)]/5"
              }`}>
                <div className={`flex items-center gap-2 text-[10px] tracking-widest font-mono ${
                  ingestStatus.ok ? "text-[var(--color-green)]" : "text-[var(--color-red)]"
                }`}>
                  {ingestStatus.ok ? "✓ INDEXADO CORRECTAMENTE" : "✗ ERROR AL INDEXAR"}
                </div>
                <div className="text-[11px] text-[var(--color-text)] mt-1">{ingestStatus.message}</div>
                {ingestStatus.ok && ingestStatus.details && (
                  <div className="text-[10px] text-[var(--color-text-dim)] font-mono mt-1 space-y-0.5">
                    <div>· {ingestStatus.details.chunks_upserted} chunks indexados</div>
                    <div>· {ingestStatus.details.transcript_chars} caracteres de transcript</div>
                    <div>· Idioma: {ingestStatus.details.language}</div>
                    <div>· Vía: {ingestStatus.details.method}</div>
                  </div>
                )}
                {!ingestStatus.ok && ingestStatus.details?.hint && (
                  <div className="text-[10px] text-[var(--color-amber)] mt-1 font-mono">{ingestStatus.details.hint}</div>
                )}
              </div>
            )}

            <div className="text-[9px] text-[var(--color-text-dim)] font-mono mt-2">
              Pipeline: youtube-transcript-api (sin rate-limit) → chunk 400p/40 overlap → MiniLM-L6 embed → chromadb upsert
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
