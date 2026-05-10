"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Bell, X, Loader2, AlertTriangle, TrendingUp, Activity, Mail, Eye } from "lucide-react";

const EVENT_ICONS: Record<string, typeof Bell> = {
  signal: TrendingUp,
  trade: TrendingUp,
  alert: AlertTriangle,
  error: AlertTriangle,
  email: Mail,
  watchlist: Eye,
  system: Activity,
};

function eventIcon(eventType: string) {
  const t = (eventType || "").toLowerCase();
  for (const [key, Icon] of Object.entries(EVENT_ICONS)) {
    if (t.includes(key)) return Icon;
  }
  return Bell;
}

function eventColor(eventType: string): string {
  const t = (eventType || "").toLowerCase();
  if (t.includes("error") || t.includes("critical")) return "text-[var(--color-red)]";
  if (t.includes("alert") || t.includes("warn")) return "text-[var(--color-amber)]";
  if (t.includes("signal") || t.includes("buy")) return "text-[var(--color-green)]";
  return "text-[var(--color-cyan)]";
}

export function NotificationsPopover({ onClose }: { onClose: () => void }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.notifications().then((r) => {
      setEvents(r.events || []);
      setLoading(false);
    });
    const i = setInterval(() => {
      api.notifications().then((r) => setEvents(r.events || []));
    }, 30000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur" onClick={onClose}>
      <div className="absolute top-16 right-4 w-full max-w-sm bg-[var(--color-bg-card)] border border-[var(--color-cyan)] rounded-lg shadow-2xl glow-cyan max-h-[calc(100vh-100px)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-[var(--color-amber)]" />
            <span className="text-sm font-bold text-[var(--color-text)]">Notificaciones</span>
            <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded bg-[var(--color-amber)]/10 border border-[var(--color-amber)]/40 text-[var(--color-amber)]">
              {events.length}
            </span>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-dim)] hover:text-[var(--color-red)]">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center gap-2 p-4 text-[var(--color-text-dim)]">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-[10px] font-mono">cargando...</span>
            </div>
          )}
          {!loading && events.length === 0 && (
            <div className="text-center py-8 text-[10px] font-mono text-[var(--color-text-dim)]">
              <Bell size={32} className="mx-auto mb-3 opacity-30" />
              Sin eventos recientes
            </div>
          )}
          {!loading && events.slice(-30).reverse().map((e: any, i: number) => {
            const Icon = eventIcon(e.event_type);
            const color = eventColor(e.event_type);
            return (
              <div
                key={i}
                className="flex items-start gap-2 px-2 py-2 rounded hover:bg-white/[0.02] border-b border-[var(--color-border)]/30 last:border-b-0"
              >
                <Icon size={12} className={`${color} mt-0.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] tracking-widest font-mono uppercase ${color}`}>
                      {e.event_type || "event"}
                    </span>
                    {e.symbol && (
                      <span className="text-[10px] font-mono text-[var(--color-text)]">
                        {e.symbol}
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] font-mono text-[var(--color-text-dim)] mt-0.5">
                    {(e.timestamp_utc || e.ts || "").replace("T", " ").substring(0, 19)}
                  </div>
                  {e.message && (
                    <div className="text-[10px] text-[var(--color-text-dim)] mt-1 line-clamp-2">
                      {e.message}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-[var(--color-border)] text-center">
          <span className="text-[8px] tracking-widest font-mono text-[var(--color-text-dim)]">
            AUTO-REFRESH 30s
          </span>
        </div>
      </div>
    </div>
  );
}
