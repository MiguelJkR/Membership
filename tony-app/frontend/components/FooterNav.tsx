"use client";
import { LayoutDashboard, TrendingUp, Brain, Mail, ShieldCheck, Mic, RefreshCw } from "lucide-react";
import { useState } from "react";

const ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, label: "DASHBOARD" },
  { id: "trading", icon: TrendingUp, label: "BOT TRADING" },
  { id: "intel", icon: Brain, label: "INTEL" },
  { id: "email", icon: Mail, label: "EMAIL" },
  { id: "security", icon: ShieldCheck, label: "SEGURIDAD" },
];

export function FooterNav({
  active,
  onSelect,
  onVoice,
  onRefresh,
}: {
  active: string;
  onSelect: (id: string) => void;
  onVoice: () => void;
  onRefresh: () => void;
}) {
  const [refreshing, setRefreshing] = useState(false);

  return (
    <div className="flex items-center justify-around gap-2 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded transition-colors ${
              isActive ? "text-[var(--color-cyan)] bg-[var(--color-cyan)]/10 glow-cyan" : "text-[var(--color-text-dim)] hover:text-[var(--color-cyan)]"
            }`}
          >
            <Icon size={18} strokeWidth={1.5} />
            <span className="text-[8px] tracking-widest font-mono">{item.label}</span>
          </button>
        );
      })}
      <div className="w-px h-8 bg-[var(--color-border)] mx-1" />
      <button
        onClick={onVoice}
        className="flex flex-col items-center gap-1 px-3 py-2 rounded text-[var(--color-text-dim)] hover:text-[var(--color-green)] transition-colors"
      >
        <Mic size={18} strokeWidth={1.5} />
        <span className="text-[8px] tracking-widest font-mono">VOICE</span>
      </button>
      <button
        onClick={async () => {
          setRefreshing(true);
          await onRefresh();
          setTimeout(() => setRefreshing(false), 1500);
        }}
        className="flex flex-col items-center gap-1 px-3 py-2 rounded text-[var(--color-text-dim)] hover:text-[var(--color-amber)] transition-colors"
      >
        <RefreshCw size={18} strokeWidth={1.5} className={refreshing ? "animate-spin" : ""} />
        <span className="text-[8px] tracking-widest font-mono">REFRESH</span>
      </button>
    </div>
  );
}
