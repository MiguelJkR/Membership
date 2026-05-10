"use client";
import { useEffect, useState } from "react";
import { api, fmt } from "@/lib/api";
import { MoreVertical } from "lucide-react";

/**
 * ACTIVIDAD RECIENTE card (Claude Design):
 *  - Lista con avatar circular (letra inicial)
 *  - Nombre símbolo + tipo COMPRA/VENTA en gris
 *  - Monto + hora alineado derecha
 *  - Color del monto: verde (compra positiva), rojo (negativo)
 */
export function ActividadRecienteCard() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const r = await api.notifications();
        if (mounted) setEvents(r.events || []);
      } catch {}
    }
    load();
    const i = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(i); };
  }, []);

  // Sort newest first + take top 8
  const items = [...events].reverse().slice(0, 8);

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] tracking-[0.25em] font-mono text-[var(--color-text)] font-semibold">
          ACTIVIDAD RECIENTE
        </h3>
        <button className="text-[var(--color-text-dim)] hover:text-[var(--color-green)]">
          <MoreVertical size={14} />
        </button>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto">
        {items.length === 0 && (
          <div className="text-center py-8 text-[10px] font-mono text-[var(--color-text-dim)]">
            Sin actividad reciente
          </div>
        )}
        {items.map((e, i) => (
          <ActivityRow key={i} event={e} />
        ))}
      </div>
    </div>
  );
}

function ActivityRow({ event }: { event: any }) {
  const symbol = (event.symbol || event.subject || "?").toString().toUpperCase();
  const initial = symbol.charAt(0) || "•";
  const action = (event.action || event.event_type || "").toString().toUpperCase();
  const isBuy = action.includes("BUY") || action.includes("COMPRA");
  const isSell = action.includes("SELL") || action.includes("VENTA");
  const typeLabel = isBuy ? "COMPRA" : isSell ? "VENTA" : (action || "EVENT");

  const pnl = Number(event.pnl_change || event.pnl || 0);
  const price = Number(event.price || 0);
  const shares = Number(event.shares || event.qty || 0);
  const amount = price && shares ? price * shares : (pnl || 0);
  const showAmount = amount !== 0;
  const isPos = amount > 0 || isBuy;

  // Time HH:MM
  let timeLabel = "";
  const ts = event.timestamp_utc || event.ts;
  if (ts) {
    try {
      const d = new Date(ts);
      const hh = d.getHours().toString().padStart(2, "0");
      const mm = d.getMinutes().toString().padStart(2, "0");
      timeLabel = `${hh}:${mm} ${d.getHours() >= 12 ? "PM" : "AM"}`;
    } catch {}
  }

  // Avatar color by symbol hash
  const colors = [
    { bg: "bg-[var(--color-cyan)]/20", text: "text-[var(--color-cyan)]", border: "border-[var(--color-cyan)]/40" },
    { bg: "bg-[var(--color-green)]/20", text: "text-[var(--color-green)]", border: "border-[var(--color-green)]/40" },
    { bg: "bg-[var(--color-amber)]/20", text: "text-[var(--color-amber)]", border: "border-[var(--color-amber)]/40" },
    { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/40" },
    { bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/40" },
  ];
  const colorIdx = symbol.charCodeAt(0) % colors.length;
  const c = colors[colorIdx];

  return (
    <div className="flex items-center gap-3 hover:bg-white/[0.02] rounded px-2 py-1.5 -mx-2 transition-colors">
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full ${c.bg} ${c.border} border flex items-center justify-center shrink-0`}
      >
        <span className={`text-[11px] font-bold font-mono ${c.text}`}>{initial}</span>
      </div>

      {/* Symbol + action */}
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-[var(--color-text)] truncate">{symbol}</div>
        <div className="text-[9px] tracking-widest font-mono text-[var(--color-text-dim)]">{typeLabel}</div>
      </div>

      {/* Amount + time */}
      <div className="text-right shrink-0">
        {showAmount && (
          <div className={`text-[11px] font-mono font-semibold tabular-nums ${
            isPos ? "text-[var(--color-green)]" : "text-[var(--color-red)]"
          }`}>
            {isPos ? "+" : ""}{fmt(amount)}
          </div>
        )}
        <div className="text-[9px] font-mono text-[var(--color-text-dim)]">{timeLabel}</div>
      </div>
    </div>
  );
}
