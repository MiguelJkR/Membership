"use client";
import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Bot, Send, Loader2, CheckCircle2, XCircle, Sparkles,
  ChevronRight, Clock, Cpu,
} from "lucide-react";
import Link from "next/link";

const QUICK_PROMPTS = [
  "Estado actual del portfolio Moomoo",
  "Resumen de notificaciones de hoy",
  "Lista los workflows n8n con error",
  "Cuantos archivos .py hay en .claude-agent",
  "Dame las ultimas 5 noticias NVDA",
];

type AgentResult = {
  ok?: boolean;
  status?: string;
  iterations?: number;
  final_answer?: string | null;
  trace?: any[];
  error?: string | null;
  id?: string;
};

/** QUICK AGENT — ejecutar Tony desde el Dashboard sin abrir /agents */
export function QuickAgentWidget() {
  const [goal, setGoal] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startTsRef = useRef<number>(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live elapsed counter while running
  useEffect(() => {
    if (running) {
      startTsRef.current = Date.now();
      tickerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTsRef.current) / 100) / 10);
      }, 100);
    } else {
      if (tickerRef.current) clearInterval(tickerRef.current);
    }
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [running]);

  const runGoal = async (g?: string) => {
    const finalGoal = (g ?? goal).trim();
    if (!finalGoal || running) return;
    setRunning(true);
    setResult(null);
    setElapsed(0);
    try {
      const r = await api.agentRun(finalGoal);
      setResult(r as AgentResult);
    } catch (e: any) {
      setResult({ ok: false, error: e?.message || "fail", status: "error" });
    } finally {
      setRunning(false);
    }
  };

  const setQuick = (p: string) => {
    setGoal(p);
    setTimeout(() => runGoal(p), 50);
  };

  const isOk = result && (result.status === "complete" || result.ok === true);
  const model =
    result?.trace?.find((t: any) => t.type === "assistant")?.model || "—";
  const providerEmoji = (m: string) => {
    const ml = m.toLowerCase();
    if (ml.includes("claude") || ml.includes("anthropic")) return { label: "ANTHROPIC", color: "text-[var(--color-amber)]", icon: Sparkles };
    if (ml.includes("ollama") || ml.includes("llama3")) return { label: "OLLAMA", color: "text-[var(--color-cyan)]", icon: Cpu };
    return { label: "GROQ", color: "text-[var(--color-green)]", icon: Sparkles };
  };

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] tracking-[0.25em] font-mono text-[var(--color-text)] font-semibold flex items-center gap-2">
          <Bot size={12} className="text-[var(--color-green)]" />
          QUICK AGENT
        </h3>
        <Link
          href="/agents"
          className="text-[9px] tracking-widest font-mono text-[var(--color-text-dim)] hover:text-[var(--color-green)] flex items-center gap-1"
        >
          CONSOLA COMPLETA <ChevronRight size={10} />
        </Link>
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 mb-3 relative">
        <div className="relative flex-1">
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                runGoal();
              }
            }}
            placeholder="Pedile algo a Tony... (Enter para ejecutar)"
            disabled={running}
            className="w-full pl-9 pr-3 py-2 bg-black/40 border border-[var(--color-border)] rounded text-[11px] font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-green)]/60 placeholder:text-[var(--color-text-dim)] disabled:opacity-50"
          />
          <Bot size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" />
        </div>
        <button
          onClick={() => runGoal()}
          disabled={!goal.trim() || running}
          className="flex items-center gap-1.5 px-3 py-2 rounded border border-[var(--color-green)]/40 bg-[var(--color-green)]/10 text-[var(--color-green)] hover:bg-[var(--color-green)]/20 disabled:opacity-40 transition-colors"
          title="Ejecutar (Enter)"
        >
          {running ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          <span className="text-[10px] tracking-widest font-mono hidden md:inline">
            {running ? "..." : "RUN"}
          </span>
        </button>
      </div>

      {/* Quick prompts */}
      {!result && !running && (
        <div className="space-y-1 mb-3">
          <div className="text-[8px] tracking-[0.3em] font-mono text-[var(--color-text-dim)] mb-1">
            EJEMPLOS RÁPIDOS
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.slice(0, 3).map((p) => (
              <button
                key={p}
                onClick={() => setQuick(p)}
                className="text-[9px] font-mono px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-green)] hover:border-[var(--color-green)]/40 transition-colors"
              >
                {p.length > 35 ? p.slice(0, 35) + "..." : p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Running indicator */}
      {running && (
        <div className="flex items-center gap-3 px-3 py-3 rounded border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/5 mb-3">
          <Loader2 size={14} className="animate-spin text-[var(--color-cyan)] shrink-0" />
          <div className="flex-1">
            <div className="text-[10px] tracking-widest font-mono text-[var(--color-cyan)]">
              EJECUTANDO TONY AGENT
            </div>
            <div className="text-[9px] font-mono text-[var(--color-text-dim)] mt-0.5">
              Goal: {goal.slice(0, 60)}{goal.length > 60 ? "..." : ""}
            </div>
          </div>
          <span className="text-[10px] font-mono tabular-nums text-[var(--color-cyan)] shrink-0">
            {elapsed.toFixed(1)}s
          </span>
        </div>
      )}

      {/* Result */}
      {result && !running && (
        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
          {/* Status header */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded border text-[10px] font-mono ${
              isOk
                ? "border-[var(--color-green)]/40 bg-[var(--color-green)]/5 text-[var(--color-green)]"
                : "border-[var(--color-red)]/40 bg-[var(--color-red)]/5 text-[var(--color-red)]"
            }`}
          >
            {isOk ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            <span className="tracking-widest font-bold">
              {isOk ? "COMPLETADO" : "ERROR"}
            </span>
            {result.iterations !== undefined && (
              <span className="text-[var(--color-text-dim)]">
                · {result.iterations} iter
              </span>
            )}
            {model && model !== "—" && (() => {
              const p = providerEmoji(model);
              const Icon = p.icon;
              return (
                <span className={`ml-auto flex items-center gap-1 ${p.color}`}>
                  <Icon size={10} />
                  {p.label}
                </span>
              );
            })()}
          </div>

          {/* Final answer */}
          {result.final_answer && (
            <div className="text-[11px] text-[var(--color-text)] leading-relaxed flex-1 overflow-y-auto px-3 py-2 rounded bg-black/30 border border-[var(--color-border)] max-h-32">
              {result.final_answer}
            </div>
          )}

          {/* Error */}
          {!isOk && result.error && (
            <div className="text-[10px] font-mono text-[var(--color-red)] px-3 py-2 rounded bg-[var(--color-red)]/5 border border-[var(--color-red)]/30">
              {String(result.error).slice(0, 200)}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-[var(--color-border)]">
            <button
              onClick={() => {
                setResult(null);
                setGoal("");
              }}
              className="text-[9px] tracking-widest font-mono text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
            >
              NUEVA CONSULTA
            </button>
            {result.id && (
              <Link
                href="/agents"
                className="text-[9px] tracking-widest font-mono text-[var(--color-cyan)] hover:underline flex items-center gap-1"
              >
                VER TRACE COMPLETO <ChevronRight size={10} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Empty state - footer hint */}
      {!result && !running && (
        <div className="mt-auto pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[9px] font-mono text-[var(--color-text-dim)]">
          <span>22 herramientas disponibles</span>
          <span>Cascade: Groq → Claude → Ollama</span>
        </div>
      )}
    </div>
  );
}
