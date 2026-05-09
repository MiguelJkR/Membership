import { ReactNode } from "react";

export function Card({
  title,
  children,
  className = "",
  glow,
  scanline,
  action,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  glow?: "cyan" | "green";
  scanline?: boolean;
  action?: ReactNode;
}) {
  return (
    <div
      className={`relative rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur p-4 ${
        glow === "cyan" ? "glow-cyan" : glow === "green" ? "glow-green" : ""
      } ${scanline ? "scanline" : ""} ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border)]">
          {title && (
            <div className="text-[10px] font-mono tracking-[0.2em] text-[var(--color-cyan)]">
              ▸ {title}
            </div>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function MiniMetric({ label, value, tone }: { label: string; value: string; tone?: "green" | "red" | "cyan" | "amber" }) {
  const color =
    tone === "green" ? "text-[var(--color-green)]" :
    tone === "red" ? "text-[var(--color-red)]" :
    tone === "amber" ? "text-[var(--color-amber)]" :
    "text-[var(--color-cyan)]";
  return (
    <div className="flex flex-col py-2 px-3 bg-black/30 rounded border border-[var(--color-border)]">
      <span className="text-[9px] uppercase tracking-widest text-[var(--color-text-dim)]">{label}</span>
      <span className={`text-lg font-mono font-semibold ${color}`}>{value}</span>
    </div>
  );
}
