"use client";
import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Send, Loader2, Bot, User, Zap } from "lucide-react";

type Msg = { role: "user" | "tony"; text: string; source?: string; model?: string; ts: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "tony", text: "Hola Miguel. Soy Tony. ¿En qué te ayudo hoy?", ts: new Date().toISOString(), source: "init" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [llmStatus, setLlmStatus] = useState<any>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { api.llmStatus().then(setLlmStatus); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", text: input, ts: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const r = await api.tonyChat(userMsg.text);
      // Wrapper output is wrapped in stdout from safe_run; parse if needed
      const responseText = r.response || (r as any).stdout?.match(/"response":\s*"([^"]+)"/)?.[1] || "(sin respuesta)";
      const cleanText = String(responseText).replace(/\\n/g, "\n").replace(/^"/, "").replace(/"$/, "");
      setMessages((m) => [...m, {
        role: "tony", text: cleanText,
        source: r.source || "llm",
        model: r.model,
        ts: new Date().toISOString()
      }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "tony", text: "Error: " + String(e), ts: new Date().toISOString() }]);
    }
    setLoading(false);
  }

  const QUICK_PROMPTS = [
    "Estado del portfolio hoy",
    "Resumen ML_SuperTrend_Bot last 7d",
    "Análisis técnico AAL post Iran",
    "Mejores setups forex próxima semana",
    "Riesgo CPI martes",
  ];

  return (
    <div className="p-5 flex flex-col h-[calc(100vh-60px)]">
      <PageHeader
        title="Tony Chat"
        subtitle="DIRECT LLM · GROQ + OLLAMA FALLBACK · NO TELEGRAM ROUNDTRIP"
        action={
          llmStatus && (
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className={`px-2 py-1 rounded border ${llmStatus.groq_key ? "border-[var(--color-green)] text-[var(--color-green)]" : "border-[var(--color-red)] text-[var(--color-red)]"}`}>
                GROQ {llmStatus.groq_key ? "OK" : "DOWN"}
              </span>
              <span className={`px-2 py-1 rounded border ${llmStatus.ollama_running ? "border-[var(--color-green)] text-[var(--color-green)]" : "border-[var(--color-amber)] text-[var(--color-amber)]"}`}>
                OLLAMA {llmStatus.ollama_running ? "OK" : "OFF"}
              </span>
            </div>
          )
        }
      />

      <Card className="flex-1 flex flex-col min-h-0" glow="cyan">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                m.role === "user" ? "border-[var(--color-cyan)] bg-[var(--color-cyan)]/10" : "border-[var(--color-green)] bg-[var(--color-green)]/10"
              }`}>
                {m.role === "user" ? <User size={14} className="text-[var(--color-cyan)]" /> : <Bot size={14} className="text-[var(--color-green)]" />}
              </div>
              <div className={`flex flex-col gap-1 max-w-[80%] ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-4 py-3 rounded-lg whitespace-pre-wrap text-sm ${
                  m.role === "user"
                    ? "bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/40 text-[var(--color-text)]"
                    : "bg-[var(--color-green)]/5 border border-[var(--color-green)]/30 text-[var(--color-text)]"
                }`}>
                  {m.text}
                </div>
                <div className="flex items-center gap-2 text-[8px] font-mono tracking-widest text-[var(--color-text-dim)]">
                  <span>{m.ts.substr(11, 5)}</span>
                  {m.source && <span>· VIA {m.source.toUpperCase()}</span>}
                  {m.model && <span>· {m.model}</span>}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full border-2 border-[var(--color-green)]/40 flex items-center justify-center">
                <Loader2 size={14} className="text-[var(--color-green)] animate-spin" />
              </div>
              <div className="px-4 py-3 rounded-lg bg-[var(--color-green)]/5 border border-[var(--color-green)]/20 text-[10px] font-mono text-[var(--color-text-dim)]">
                Pensando... (Groq 2-5s · Ollama 30-90s)
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--color-border)] mt-3">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => setInput(p)}
              disabled={loading}
              className="text-[10px] font-mono tracking-widest px-3 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-cyan)] hover:border-[var(--color-cyan)]/40 transition-colors"
            >
              <Zap size={10} className="inline mr-1" />{p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2 pt-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            disabled={loading}
            placeholder="Preguntale a Tony..."
            className="flex-1 px-4 py-2 bg-black/40 border border-[var(--color-border)] rounded text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-cyan)] font-mono"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-4 py-2 rounded bg-[var(--color-cyan)]/20 border border-[var(--color-cyan)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </Card>
    </div>
  );
}
