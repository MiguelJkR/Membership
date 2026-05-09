"use client";

const CATEGORY_COLOR: Record<string, string> = {
  trading: "text-[var(--color-cyan)]",
  ml_bot: "text-[var(--color-green)]",
  brain: "text-purple-400",
  ops: "text-orange-300",
  content: "text-pink-400",
  default: "text-[var(--color-text-dim)]",
};

export function AgentsList({ agents = [] }: { agents?: Array<{ name: string; category: string; active: boolean }> }) {
  if (!agents.length) {
    return <div className="text-[10px] text-[var(--color-text-dim)] py-4">Sin datos</div>;
  }
  return (
    <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
      {agents.slice(0, 16).map((a, i) => {
        const cat = a.category || "default";
        const tone = CATEGORY_COLOR[cat] || CATEGORY_COLOR.default;
        return (
          <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-black/40 rounded border border-[var(--color-border)] hover:border-[var(--color-border-bright)] transition-colors">
            <div className={`w-1.5 h-1.5 rounded-full ${a.active ? "bg-[var(--color-green)] animate-pulse" : "bg-[var(--color-text-dim)]"}`}></div>
            <div className="flex-1 truncate text-[11px] text-[var(--color-text)]">{a.name}</div>
            <div className={`text-[8px] uppercase tracking-widest ${tone}`}>{cat}</div>
          </div>
        );
      })}
    </div>
  );
}
