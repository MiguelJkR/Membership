"use client";
import { useEffect, useState } from "react";
import { Palette, Check } from "lucide-react";

const ACCENTS = [
  { id: "cyan",   label: "Cyan",   hex: "#00e5ff", glow: "rgba(0, 229, 255, 0.4)" },
  { id: "green",  label: "Verde",  hex: "#4ade80", glow: "rgba(74, 222, 128, 0.4)" },
  { id: "purple", label: "Púrpura", hex: "#a78bfa", glow: "rgba(167, 139, 250, 0.4)" },
  { id: "orange", label: "Naranja", hex: "#fb923c", glow: "rgba(251, 146, 60, 0.4)" },
  { id: "coral",  label: "Coral",  hex: "#ff4d5e", glow: "rgba(255, 77, 94, 0.4)" },
  { id: "amber",  label: "Ámbar",  hex: "#fbbf24", glow: "rgba(251, 191, 36, 0.4)" },
] as const;

const STORAGE_KEY = "tony_accent_color";

/**
 * Cambia dinámicamente el accent color de toda la app modificando
 * --color-cyan en el :root via document.documentElement.style.
 *
 * Persistido en localStorage (por user, no por sesión).
 */
export function AccentPicker() {
  const [current, setCurrent] = useState<string>("cyan");

  // Apply on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const accent = ACCENTS.find((a) => a.id === stored);
        if (accent) {
          applyAccent(accent.hex, accent.glow);
          setCurrent(accent.id);
        }
      }
    } catch {}
  }, []);

  function applyAccent(hex: string, glow: string) {
    const root = document.documentElement;
    root.style.setProperty("--color-cyan", hex);
    // Update glow halo too
    root.style.setProperty("--color-cyan-glow", glow);
    // For some elements that use rgba directly
    root.style.setProperty("--color-cyan-soft", hex + "26"); // ~15% alpha
  }

  function selectAccent(accentId: string) {
    const accent = ACCENTS.find((a) => a.id === accentId);
    if (!accent) return;
    applyAccent(accent.hex, accent.glow);
    setCurrent(accentId);
    try { localStorage.setItem(STORAGE_KEY, accentId); } catch {}
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Palette size={14} className="text-[var(--color-cyan)]" />
        <span className="text-[10px] tracking-widest font-mono text-[var(--color-text-dim)]">ACENTO</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {ACCENTS.map((a) => (
          <button
            key={a.id}
            onClick={() => selectAccent(a.id)}
            className={`relative p-3 rounded-lg border-2 transition-all hover:scale-105 ${
              current === a.id
                ? "border-white"
                : "border-[var(--color-border)]"
            }`}
            style={{
              background: a.hex + "14",
              boxShadow: current === a.id ? `0 0 12px ${a.glow}` : "none",
            }}
            title={a.label}
          >
            <div
              className="w-full h-8 rounded"
              style={{ background: a.hex, boxShadow: `0 0 8px ${a.glow}` }}
            />
            <div className="text-[8px] tracking-widest font-mono mt-1.5 text-[var(--color-text-dim)] uppercase">
              {a.label}
            </div>
            {current === a.id && (
              <div
                className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center"
              >
                <Check size={10} className="text-black" strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>
      <div className="text-[9px] font-mono text-[var(--color-text-dim)] italic">
        Cambio inmediato. Guardado por navegador (localStorage).
      </div>
    </div>
  );
}
