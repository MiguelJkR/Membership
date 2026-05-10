"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Brain, Loader2, CheckCircle2, AlertCircle, Wrench,
  ChevronRight, MoreVertical,
} from "lucide-react";
import Link from "next/link";

type MemoryItem = {
  id: string;
  goal: string;
  final_answer: string;
  status: string;
  iterations: number;
  tools_used: string;
  stored_at: number;
  created_at: number;
};

/** MEMORIA SEMÁNTICA — what Tony just learned (last N sessions in chromadb) */
export function MemoriaSemanticaWidget({ n = 5 }: { n?: number }) {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await api.memoryRecent(n);
        if (!cancelled && r.ok) {
          setItems(r.items || []);
          setTotal(r.total || 0);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    };
    load();
    const i = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(i); };
  }, [n]);

  const fmtAge = (ts: number) => {
    if (!ts) return "—";
    const diff = Date.now() - ts * 1000;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur p-5 h-full flex items-center justify-center">
        <Loader2 size={14} className="animate-spin text-[var(--color-text-dim)]" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] tracking-[0.25em] font-mono text-[var(--color-text)] font-semibold flex items-center gap-2">
          <Brain size={12} className="text-purple-400" />
          MEMORIA SEMÁNTICA
        </h3>
        <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded bg-purple-400/10 border border-purple-400/40 text-purple-400">
          {total} indexados
        </span>
      </div>

      <div className="text-[8px] tracking-[0.3em] font-mono text-[var(--color-text-dim)] mb-3 uppercase">
        Lo que Tony aprendió últimamente · embeddings MiniLM-L6 (384d)
      </div>

      {/* Items */}
      <div className="flex-1 space-y-2 overflow-y-auto max-h-64">
        {items.length === 0 && (
          <div className="text-center py-4 text-[10px] font-mono text-[var(--color-text-dim)]">
            Memoria vacía. Ejecutá agentes en /agents para llenarla.
          </div>
        )}
        {items.map((it) => {
          const isExpanded = expanded === it.id;
          const isOk = it.status === "complete";
          const tools = (it.tools_used || "").split(",").filter(Boolean);
          return (
            <div
              key={it.id}
              className="rounded border border-[var(--color-border)] bg-black/30 px-2.5 py-2 cursor-pointer hover:border-purple-400/30 transition-colors"
              onClick={() => setExpanded(isExpanded ? null : it.id)}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  {isOk ? (
                    <CheckCircle2 size={11} className="text-[var(--color-green)] mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle size={11} className="text-[var(--color-amber)] mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-[var(--color-text)] truncate" title={it.goal}>
                      {it.goal || "(sin goal)"}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[8px] font-mono text-[var(--color-text-dim)]">
                      <span>{it.iterations}iter</span>
                      {tools.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Wrench size={8} />
                          {tools.length}t
                        </span>
                      )}
                      <span className="ml-auto">{fmtAge(it.stored_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded answer */}
              {isExpanded && it.final_answer && (
                <div className="mt-2 pt-2 border-t border-[var(--color-border)] text-[10px] text-[var(--color-text-dim)] leading-relaxed">
                  <span className="text-purple-400 font-mono tracking-widest text-[8px] block mb-1">
                    RESPUESTA
                  </span>
                  {it.final_answer}
                  {tools.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {tools.map((t) => (
                        <span
                          key={t}
                          className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-purple-400/10 border border-purple-400/30 text-purple-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[9px] font-mono">
        <span className="text-[var(--color-text-dim)]">
          AUTO-REFRESH 60s
        </span>
        <Link
          href="/agents"
          className="text-purple-400 hover:underline flex items-center gap-1 tracking-widest"
        >
          IR A CONSOLA <ChevronRight size={10} />
        </Link>
      </div>
    </div>
  );
}
