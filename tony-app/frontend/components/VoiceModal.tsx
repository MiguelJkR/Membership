"use client";
import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { Volume2, X, Loader2, Send, Mic } from "lucide-react";

const QUICK_PROMPTS = [
  "Sistema operativo, Miguel.",
  "Reporte AAL: posición y P/L",
  "Estado del sistema",
  "Cuántos workflows tengo",
  "Resumen del día",
];

/**
 * Voice modal — Tony habla por TTS.
 * Input: texto en español, output: audio que reproduce el browser.
 */
export function VoiceModal({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function speak() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setAudioUrl(null);
    try {
      const r: any = await api.voice(text);
      // Backend may return an audio URL OR just a success ack (depending on impl)
      if (r.audio_url) {
        setAudioUrl(r.audio_url);
        // Auto-play
        setTimeout(() => audioRef.current?.play(), 100);
      } else if (r.ok) {
        // No URL but success — backend played locally via pyttsx3
        // Try browser SpeechSynthesis as fallback
        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = "es-ES";
          u.rate = 1.0;
          window.speechSynthesis.speak(u);
        }
      }
    } catch (e) {
      // fallback: browser native TTS
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "es-ES";
        window.speechSynthesis.speak(u);
      }
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-5" onClick={onClose}>
      <div
        className="bg-[var(--color-bg-card)] border border-[var(--color-cyan)] rounded-lg p-5 w-full max-w-md glow-cyan"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Volume2 size={18} className="text-[var(--color-cyan)]" />
            <h2 className="text-lg font-bold text-[var(--color-text)]">Tony habla</h2>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-dim)] hover:text-[var(--color-red)]">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono">
              TEXTO PARA HABLAR
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) speak();
              }}
              rows={3}
              placeholder="Sistema operativo, Miguel..."
              autoFocus
              className="w-full mt-1 px-3 py-2 bg-black/40 border border-[var(--color-border)] rounded text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-cyan)] resize-none"
            />
          </div>

          <div>
            <div className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono mb-1">
              PROMPTS RÁPIDOS
            </div>
            <div className="flex flex-wrap gap-1">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setText(p)}
                  className="text-[9px] font-mono px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-cyan)] hover:border-[var(--color-cyan)]/40"
                >
                  {p.length > 30 ? p.slice(0, 28) + "…" : p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
            >
              <span className="text-[10px] tracking-widest font-mono">CANCELAR</span>
            </button>
            <button
              onClick={speak}
              disabled={loading || !text.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded bg-[var(--color-cyan)]/20 border border-[var(--color-cyan)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/40 disabled:opacity-40"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span className="text-[10px] tracking-widest font-mono">
                {loading ? "HABLANDO..." : "HABLAR"}
              </span>
            </button>
          </div>

          {audioUrl && (
            <audio ref={audioRef} src={audioUrl} controls className="w-full mt-2" />
          )}

          <div className="text-[9px] text-[var(--color-text-dim)] font-mono italic flex items-center gap-1">
            <Mic size={10} />
            Ctrl+Enter para enviar rápido · Voz fallback browser SpeechSynthesis
          </div>
        </div>
      </div>
    </div>
  );
}
