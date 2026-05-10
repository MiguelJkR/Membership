"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STORAGE_KEY = "tony_pwa_install_dismissed";

/**
 * PWA install prompt banner.
 * - Shows when browser fires `beforeinstallprompt` (Chrome/Edge desktop + Android)
 * - On iOS Safari: shows manual instructions (no native install event)
 * - Dismissible — won't re-show for 7 days
 */
export function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Don't show if dismissed within last 7 days
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed) {
        const ts = parseInt(dismissed, 10);
        if (Date.now() - ts < 7 * 24 * 60 * 60 * 1000) return;
      }
    } catch {}

    // Don't show if already installed (matchMedia standalone)
    if (typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)")?.matches) {
      setInstalled(true);
      return;
    }

    // iOS Safari: no install event, show manual hint
    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/i.test(ua) && !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    if (isIos && isSafari) {
      setShowIosHint(true);
      return;
    }

    // Desktop/Android Chrome: native install event
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
    setInstallEvent(null);
    setShowIosHint(false);
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setInstallEvent(null);
  }

  if (installed) return null;
  if (!installEvent && !showIosHint) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-[var(--color-bg-card)] border border-[var(--color-cyan)] rounded-lg shadow-2xl p-4 glow-cyan">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)] flex items-center justify-center shrink-0">
          <Download size={18} className="text-[var(--color-cyan)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-[var(--color-text)]">Instalá Tony AI</div>
          {installEvent ? (
            <p className="text-[11px] text-[var(--color-text-dim)] mt-1">
              Como app nativa con acceso rápido en escritorio o pantalla de inicio.
            </p>
          ) : (
            <p className="text-[11px] text-[var(--color-text-dim)] mt-1 leading-relaxed">
              Tap el botón <span className="text-[var(--color-cyan)]">Compartir</span> →
              "Añadir a pantalla de inicio".
            </p>
          )}
          {installEvent && (
            <button
              onClick={install}
              className="mt-3 px-4 py-1.5 rounded bg-[var(--color-cyan)]/20 border border-[var(--color-cyan)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/40 transition-colors flex items-center gap-2"
            >
              <Download size={12} />
              <span className="text-[10px] font-mono tracking-widest">INSTALAR</span>
            </button>
          )}
        </div>
        <button
          onClick={dismiss}
          className="text-[var(--color-text-dim)] hover:text-[var(--color-red)] shrink-0"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
