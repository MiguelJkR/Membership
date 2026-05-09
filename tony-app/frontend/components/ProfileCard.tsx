"use client";
import Image from "next/image";
import { fmt } from "@/lib/api";

export function ProfileCard({ totalValue, breakdown }: { totalValue?: number; breakdown?: string }) {
  return (
    <div className="relative rounded-lg border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-bg-card)] to-black/60 p-4 overflow-hidden glow-cyan">
      <div className="flex items-center gap-3">
        <div className="relative w-14 h-14 rounded-full border-2 border-[var(--color-cyan)] overflow-hidden bg-black flex items-center justify-center">
          <Image
            src="/tony-character-1.png"
            alt="TONY"
            width={56}
            height={56}
            className="object-cover scale-150 opacity-90"
            priority
          />
        </div>
        <div className="flex flex-col flex-1">
          <div className="text-[10px] font-mono tracking-[0.3em] text-[var(--color-cyan)]">WATCH_BOT</div>
          <div className="text-base font-bold text-[var(--color-text)]">TONY AI</div>
          <div className="text-[9px] text-[var(--color-text-dim)] font-mono">CONFIABLE · EFICIENTE</div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
        <div className="text-[9px] uppercase tracking-widest text-[var(--color-text-dim)]">Portfolio</div>
        <div className="text-2xl font-mono font-bold text-[var(--color-green)] glow-green inline-block">
          {fmt(totalValue)}
        </div>
        {breakdown && (
          <div className="text-[10px] text-[var(--color-text-dim)] font-mono mt-1">{breakdown}</div>
        )}
      </div>
    </div>
  );
}
