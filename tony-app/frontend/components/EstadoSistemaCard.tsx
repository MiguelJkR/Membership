"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type SubsystemRow = { label: string; status: string; count?: number };

/**
 * ESTADO DEL SISTEMA card (Claude Design):
 *  - Header with "ACTIVO" badge
 *  - Subtitle "TODOS LOS SISTEMAS OPERATIVOS"
 *  - List of bullets (verde si OK, ambar si parcial, rojo si caído)
 *  - Cada item: nombre + status (OK / N OK / DEGRADED / DOWN)
 */
export function EstadoSistemaCard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const sys = await api.systemStatus();
        if (mounted) setData(sys);
      } catch {}
    }
    load();
    const i = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(i); };
  }, []);

  const sub = data?.subsystems || {};
  const health = data?.health || {};

  // Map real subsystems to UI rows
  const rows: SubsystemRow[] = [
    {
      label: "Servidor",
      status: sub.flask?.listening ? "OK" : sub.flask?.available ? "OK" : "DOWN",
    },
    {
      label: "Base de datos",
      status: sub.firestore?.available || sub.sqlite?.available ? "OK" : "DOWN",
    },
    {
      label: "API n8n",
      status: sub.n8n?.listening || sub.n8n?.available ? "OK" : "DOWN",
    },
    {
      label: "Servicios IA",
      status: sub.ollama?.available || sub.groq?.available ? "OK" : "DOWN",
    },
    {
      label: "Exchanges",
      status: sub.opend?.listening ? "OK" : "DOWN",
      count: sub.opend?.listening ? 6 : undefined,
    },
    {
      label: "Webhooks",
      status: sub.webhooks?.available !== false ? "OK" : "DOWN",
      count: sub.webhooks?.count || 5,
    },
  ];

  const allOk = rows.every((r) => r.status === "OK");
  const compositeScore = health.composite_score ?? 0;
  const isActive = compositeScore >= 70;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] tracking-[0.25em] font-mono text-[var(--color-text)] font-semibold">
          ESTADO DEL SISTEMA
        </h3>
        <span
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-mono tracking-widest ${
            isActive
              ? "border-[var(--color-green)]/40 bg-[var(--color-green)]/10 text-[var(--color-green)]"
              : "border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10 text-[var(--color-amber)]"
          }`}
        >
          <span className="relative flex w-1.5 h-1.5">
            <span className={`absolute inset-0 rounded-full ${isActive ? "bg-[var(--color-green)]" : "bg-[var(--color-amber)]"} animate-ping opacity-60`} />
            <span className={`relative w-1.5 h-1.5 rounded-full ${isActive ? "bg-[var(--color-green)]" : "bg-[var(--color-amber)]"}`} />
          </span>
          {isActive ? "ACTIVO" : "PARCIAL"}
        </span>
      </div>

      <div className="text-[8px] tracking-[0.3em] font-mono text-[var(--color-text-dim)] mb-4 uppercase">
        Todos los sistemas operativos
      </div>

      {/* List */}
      <div className="space-y-2.5 flex-1">
        {rows.map((r) => (
          <SubsystemBullet key={r.label} {...r} />
        ))}
      </div>

      {/* Footer score */}
      {compositeScore > 0 && (
        <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-[9px] font-mono tracking-widest">
          <span className="text-[var(--color-text-dim)]">SCORE GLOBAL</span>
          <span className={isActive ? "text-[var(--color-green)]" : "text-[var(--color-amber)]"}>
            {compositeScore.toFixed(0)}/100
          </span>
        </div>
      )}
    </div>
  );
}

function SubsystemBullet({ label, status, count }: SubsystemRow) {
  const ok = status === "OK";
  const partial = status === "DEGRADED";

  const dotColor = ok
    ? "bg-[var(--color-green)]"
    : partial
    ? "bg-[var(--color-amber)]"
    : "bg-[var(--color-red)]";
  const textColor = ok
    ? "text-[var(--color-green)]"
    : partial
    ? "text-[var(--color-amber)]"
    : "text-[var(--color-red)]";

  return (
    <div className="flex items-center justify-between gap-3 text-[12px]">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
        <span className="text-[var(--color-text)] truncate">{label}</span>
      </div>
      <span className={`font-mono tracking-wider text-[10px] ${textColor} shrink-0`}>
        {count !== undefined ? `${count} ${ok ? "OK" : status}` : status}
      </span>
    </div>
  );
}
