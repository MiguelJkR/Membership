"use client";
import { useEffect, useState } from "react";

const SAMPLE_LINES = [
  "[BRAIN] cortex_consolidate cycle 47",
  "[ANALYST] AAPL +0.3% intraday momentum strong",
  "[BOT_TRADING] OANDA EUR_USD long 100u — sl 1.17466",
  "[GUARD] coexistence_audit OK — margin 0.4%",
  "[MOOMOO] sync OK — 4 positions",
  "[NEWS] AAL sector pressure detected — Iran",
  "[TONY] memory_compress 2024 entries — done",
  "[BACKUP] firestore daily — 1.4MB encrypted",
  "[ALERT] CPI release T-3d — risk_off bias",
  "[SIGNAL] supertrend flip XAU_USD bull → ML score 0.72",
  "[OLLAMA] local fallback active — llama3.2:3b",
  "[N8N] 47 active workflows — 0 errors 60min",
  "[GROQ] 16 models reachable — UA OK",
  "[YT_RAG] 74 chunks indexed — 7 trading videos",
  "[VAULT] github sync — last 14:25 UTC",
];

export function MatrixStream() {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const initial = SAMPLE_LINES.slice(0, 8).map(stamp);
    setLines(initial);
    const interval = setInterval(() => {
      setLines((prev) => {
        const next = SAMPLE_LINES[Math.floor(Math.random() * SAMPLE_LINES.length)];
        const updated = [...prev.slice(-12), stamp(next)];
        return updated;
      });
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  function stamp(s: string) {
    const t = new Date().toISOString().substr(11, 8);
    return `[${t}] ${s}`;
  }

  return (
    <div className="matrix-stream max-h-72 overflow-y-auto px-3 py-2 bg-black/60 rounded border border-[var(--color-green)]/20">
      {lines.map((l, i) => (
        <div key={i} className="opacity-90" style={{ opacity: 0.4 + (i / lines.length) * 0.6 }}>
          {l}
        </div>
      ))}
      <div className="text-[var(--color-green)] animate-pulse">▊</div>
    </div>
  );
}
