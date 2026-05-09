"use client";

export function RiskGauge({ score = 0, label = "" }: { score?: number; label?: string }) {
  const dashOffset = 427 - (427 * Math.min(score, 100)) / 100;
  const color = score < 40 ? "var(--color-green)" : score >= 65 ? "var(--color-red)" : "var(--color-amber)";

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <svg width="160" height="160" viewBox="0 0 160 160" className="overflow-visible">
        <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(0,229,255,0.1)" strokeWidth="4" />
        <circle
          cx="80" cy="80" r="68" fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="427"
          strokeDashoffset={dashOffset}
          transform="rotate(-90 80 80)"
          style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.3s" }}
        />
        <text x="80" y="78" textAnchor="middle" fill={color} fontSize="32" fontWeight="700" fontFamily="var(--font-mono)">
          {score.toFixed(0)}
        </text>
        <text x="80" y="98" textAnchor="middle" fill="var(--color-text-dim)" fontSize="9" letterSpacing="2">
          /100
        </text>
      </svg>
      <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-dim)] mt-1">
        Riesgo {label}
      </div>
    </div>
  );
}
