"use client";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";

/**
 * Radar — circular animated radar with detected "targets" pulled from
 * live system state. Watch Dogs-style aesthetic: rotating sweep, grid,
 * concentric circles, glowing detected blips.
 *
 * Targets:
 *  - Each connected system or active position becomes a blip
 *  - Distance from center = priority/risk inverse
 *  - Color = system status (green=ok, amber=warn, red=err)
 */

type Blip = {
  id: string;
  label: string;
  angle: number; // 0-360
  distance: number; // 0-1 (0=center, 1=edge)
  color: "green" | "amber" | "red" | "cyan";
  pulse?: boolean;
};

interface RadarProps {
  size?: number; // px diameter
  showLabels?: boolean;
}

export function Radar({ size = 220, showLabels = true }: RadarProps) {
  const [sweepAngle, setSweepAngle] = useState(0);
  const [systemState, setSystemState] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>(null);

  // Sweep rotation animation
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      // Full rotation every 4 seconds
      const angle = ((elapsed / 4000) * 360) % 360;
      setSweepAngle(angle);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Pull live data
  useEffect(() => {
    const refresh = async () => {
      try {
        const [sysRaw, pfRaw] = await Promise.all([
          api.health().catch(() => null),
          api.portfolio().catch(() => null),
        ]);
        setSystemState(sysRaw);
        setPortfolio(pfRaw);
      } catch (e) {
        // Silent fail — radar still spins
      }
    };
    refresh();
    const i = setInterval(refresh, 30000);
    return () => clearInterval(i);
  }, []);

  // Compute blips from system state
  const blips: Blip[] = useMemo(() => {
    const out: Blip[] = [];
    const components = systemState?.components || {};

    // System components → static angles (5 real subsystems)
    const systemBlips: { key: string; label: string; angle: number; dist: number }[] = [
      { key: "n8n", label: "N8N", angle: 36, dist: 0.55 },
      { key: "opend", label: "OPEND", angle: 108, dist: 0.6 },
      { key: "bot", label: "BOT", angle: 180, dist: 0.5 },
      { key: "telegram", label: "TG", angle: 252, dist: 0.55 },
      { key: "disk", label: "DISK", angle: 324, dist: 0.45 },
    ];

    for (const sb of systemBlips) {
      const check = components[sb.key];
      let color: "green" | "amber" | "red" | "cyan" = "cyan";
      if (check) {
        const score = check.score ?? 0;
        if (score >= 80) color = "green";
        else if (score >= 50) color = "amber";
        else color = "red";
      }
      out.push({
        id: sb.key,
        label: sb.label,
        angle: sb.angle,
        distance: sb.dist,
        color,
        pulse: color === "red",
      });
    }

    // Portfolio positions → outer ring
    const positions = (portfolio as any)?.positions || [];
    positions.slice(0, 6).forEach((p: any, i: number) => {
      const pl = Number(p.unrealized_pnl || 0);
      out.push({
        id: `pos_${p.symbol}_${i}`,
        label: p.symbol,
        angle: (i / 6) * 360 + 15,
        distance: 0.85,
        color: pl > 0 ? "green" : pl < 0 ? "red" : "cyan",
        pulse: false,
      });
    });

    return out;
  }, [systemState, portfolio]);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 4;
  const sweepRad = (sweepAngle * Math.PI) / 180;
  const sweepX = cx + Math.cos(sweepRad - Math.PI / 2) * radius;
  const sweepY = cy + Math.sin(sweepRad - Math.PI / 2) * radius;

  // For "detection" effect: blip is "active" when sweep passes within 30 deg
  const isBlipActive = (b: Blip) => {
    const diff = Math.abs(((b.angle - sweepAngle + 540) % 360) - 180);
    return diff > 150; // sweep just passed
  };

  const getColor = (c: string) => {
    if (c === "green") return "var(--color-green)";
    if (c === "amber") return "var(--color-amber)";
    if (c === "red") return "var(--color-red)";
    return "var(--color-cyan)";
  };

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        style={{ filter: "drop-shadow(0 0 12px rgba(0,255,255,0.25))" }}
      >
        {/* Background circle */}
        <defs>
          <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,255,255,0.08)" />
            <stop offset="70%" stopColor="rgba(0,255,255,0.02)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,255,255,0.6)" />
            <stop offset="100%" stopColor="rgba(0,255,255,0)" />
          </linearGradient>
        </defs>

        <circle cx={cx} cy={cy} r={radius} fill="url(#radarBg)" />

        {/* Concentric rings */}
        {[0.25, 0.5, 0.75, 1].map((r, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius * r}
            fill="none"
            stroke="rgba(0,255,255,0.2)"
            strokeWidth={r === 1 ? 1.5 : 0.5}
            strokeDasharray={r === 1 ? "0" : "2 3"}
          />
        ))}

        {/* Cross lines */}
        <line
          x1={cx - radius}
          y1={cy}
          x2={cx + radius}
          y2={cy}
          stroke="rgba(0,255,255,0.15)"
          strokeWidth={0.5}
        />
        <line
          x1={cx}
          y1={cy - radius}
          x2={cx}
          y2={cy + radius}
          stroke="rgba(0,255,255,0.15)"
          strokeWidth={0.5}
        />

        {/* Diagonal lines */}
        {[45, 135, 225, 315].map((deg) => {
          const r = (deg * Math.PI) / 180;
          return (
            <line
              key={deg}
              x1={cx}
              y1={cy}
              x2={cx + Math.cos(r - Math.PI / 2) * radius}
              y2={cy + Math.sin(r - Math.PI / 2) * radius}
              stroke="rgba(0,255,255,0.08)"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Sweeping arc — wedge from center */}
        <path
          d={`M ${cx} ${cy} L ${sweepX} ${sweepY} A ${radius} ${radius} 0 0 0 ${
            cx + Math.cos(sweepRad - Math.PI / 2 - 0.6) * radius
          } ${cy + Math.sin(sweepRad - Math.PI / 2 - 0.6) * radius} Z`}
          fill="url(#sweepGrad)"
          opacity={0.5}
        />

        {/* Sweep main line */}
        <line
          x1={cx}
          y1={cy}
          x2={sweepX}
          y2={sweepY}
          stroke="var(--color-cyan)"
          strokeWidth={1.5}
          opacity={0.9}
        />

        {/* Blips */}
        {blips.map((b) => {
          const r = (b.angle * Math.PI) / 180;
          const bx = cx + Math.cos(r - Math.PI / 2) * radius * b.distance;
          const by = cy + Math.sin(r - Math.PI / 2) * radius * b.distance;
          const active = isBlipActive(b);
          const color = getColor(b.color);
          return (
            <g key={b.id}>
              {/* Outer pulse */}
              {(active || b.pulse) && (
                <circle
                  cx={bx}
                  cy={by}
                  r={6}
                  fill="none"
                  stroke={color}
                  strokeWidth={1}
                  opacity={0.4}
                >
                  <animate
                    attributeName="r"
                    from="3"
                    to="10"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.6"
                    to="0"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              {/* Blip dot */}
              <circle
                cx={bx}
                cy={by}
                r={2.5}
                fill={color}
                opacity={active ? 1 : 0.7}
              />
              {/* Label */}
              {showLabels && (
                <text
                  x={bx + 5}
                  y={by - 3}
                  fontSize={7}
                  fill={color}
                  opacity={active ? 0.95 : 0.5}
                  fontFamily="var(--font-mono, monospace)"
                  className="tracking-widest"
                >
                  {b.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={2.5} fill="var(--color-cyan)" opacity={0.9} />
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill="none"
          stroke="var(--color-cyan)"
          strokeWidth={0.5}
          opacity={0.5}
        />
      </svg>

      {/* Label overlay */}
      <div className="absolute top-1 left-1 flex items-center gap-1 text-[7px] tracking-widest font-mono text-[var(--color-cyan)] opacity-70">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)] animate-pulse" />
        SCAN
      </div>
      <div className="absolute top-1 right-1 text-[7px] tracking-widest font-mono text-[var(--color-text-dim)] opacity-70">
        {blips.length} TGT
      </div>
      <div className="absolute bottom-1 left-1 text-[7px] tracking-widest font-mono text-[var(--color-text-dim)] opacity-70">
        AZ {Math.round(sweepAngle).toString().padStart(3, "0")}°
      </div>
      <div className="absolute bottom-1 right-1 text-[7px] tracking-widest font-mono text-[var(--color-text-dim)] opacity-70">
        R {radius.toFixed(0)}
      </div>
    </div>
  );
}
