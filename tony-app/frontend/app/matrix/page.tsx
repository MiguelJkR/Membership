"use client";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/Card";
import { Terminal } from "lucide-react";

const SAMPLE_LOGS = [
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
  "[RISK_MANAGER] drawdown -0.42% — within bounds",
  "[SOCIAL_WATCHER] reddit r/wallstreetbets sentiment +0.18",
  "[NEWS_AGENT] FT.com macro feed — 3 new articles",
  "[STRATEGY_AI] generating setup AAL 4h timeframe...",
  "[MARKET_SCANNER] NVDA breakout candidate detected $115",
];

export default function MatrixPage() {
  const [lines, setLines] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setLines(SAMPLE_LOGS.slice(0, 8).map(stamp));
    const interval = setInterval(() => {
      setLines((prev) => {
        const next = SAMPLE_LOGS[Math.floor(Math.random() * SAMPLE_LOGS.length)];
        return [...prev.slice(-30), stamp(next)];
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Matrix rain background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const chars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789ABCDEF$+-=*<>";
    const fontSize = 14;
    const cols = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(cols).fill(1);

    function draw() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = "rgba(5, 8, 16, 0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0, 255, 136, 0.5)";
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.97) drops[i] = 0;
        drops[i]++;
      }
    }
    const interval = setInterval(draw, 60);
    return () => clearInterval(interval);
  }, []);

  function stamp(s: string) {
    const t = new Date().toISOString().substr(11, 8);
    return `[${t}] ${s}`;
  }

  return (
    <div className="relative min-h-full">
      <canvas ref={canvasRef} className="fixed inset-0 z-0 opacity-50" />
      <div className="relative z-10 p-4 md:p-5 space-y-4">
        {/* Subheader strip — Claude Design vocabulary */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/60 backdrop-blur px-4 py-3">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-[var(--color-green)]" />
            <span className="text-[10px] tracking-[0.3em] font-mono text-[var(--color-text-dim)]">
              MODO MATRIX · FEED DE EJECUCIÓN AUTÓNOMA · ACTIVIDAD NEURAL · EN VIVO
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="FEED DE EJECUCIÓN" glow="green">
            <div className="matrix-stream max-h-[60vh] overflow-y-auto px-3 py-2 bg-black/80 rounded">
              {lines.map((l, i) => (
                <div key={i} className="leading-relaxed" style={{ opacity: 0.3 + (i / lines.length) * 0.7 }}>
                  {l}
                </div>
              ))}
              <div className="text-[var(--color-green)] animate-pulse">▊</div>
            </div>
          </Card>

          <Card title="PROCESO MENTAL DE LA IA" glow="cyan">
            <div className="font-mono text-[11px] text-[var(--color-cyan)] space-y-3 max-h-[60vh] overflow-y-auto px-3 py-2 bg-black/80 rounded">
              <div>
                <span className="text-[var(--color-text-dim)]">// strategy_ai · {new Date().toISOString().substr(11, 8)}</span>
                <div>analyzing AAL pre-CPI risk...</div>
                <div>↳ jet_fuel +82% YTD persistent</div>
                <div>↳ SPRT bankruptcy contagion possible</div>
                <div>↳ <span className="text-[var(--color-green)]">verdict: TRIM 50% Monday open</span></div>
              </div>
              <div>
                <span className="text-[var(--color-text-dim)]">// risk_manager · {new Date().toISOString().substr(11, 8)}</span>
                <div>portfolio drawdown analysis...</div>
                <div>↳ current: -0.42% from peak</div>
                <div>↳ within tolerance</div>
                <div>↳ <span className="text-[var(--color-green)]">no action</span></div>
              </div>
              <div>
                <span className="text-[var(--color-text-dim)]">// social_watcher · {new Date().toISOString().substr(11, 8)}</span>
                <div>scanning reddit + twitter sentiment...</div>
                <div>↳ r/wsb mentions: NVDA +247, AAL -89</div>
                <div>↳ aggregate bias: +0.18 bullish</div>
              </div>
              <div className="text-[var(--color-green)] animate-pulse">▊</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
