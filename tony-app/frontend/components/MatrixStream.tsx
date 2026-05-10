"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const FALLBACK_LINES = [
  "[TONY] memoria semantica · 19 sessions indexed",
  "[GROQ] llama-3.3-70b · 22 tools available",
  "[N8N] 119 workflows active · 0 errors 24h",
  "[BRAIN] cortex_consolidate cycle pending",
  "[VAULT] DPAPI keystore · 3 keys encrypted",
];

type Line = { text: string; ts: string; tone: "green" | "cyan" | "amber" | "red" | "dim" };

/**
 * MatrixStream — live event ticker for Dashboard / Modo Matrix page.
 * Pulls real events from:
 *  - /api/notifications (broker fills, alerts, trades)
 *  - /api/memory_recent (last sessions Tony processed)
 *  - /api/llm_provider_status (provider switches)
 *  - /api/n8n_workflows_status (last execution status)
 * Mixes real events with status snapshots for visual density.
 */
export function MatrixStream() {
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    const seenIds = new Set<string>();
    let cancelled = false;
    let renderQueue: Line[] = [];
    let snapshotIndex = 0;

    const stamp = () => {
      const d = new Date();
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
    };

    const detectTone = (text: string): Line["tone"] => {
      const t = text.toLowerCase();
      if (t.includes("error") || t.includes("fail") || t.includes("down") || t.includes("err")) return "red";
      if (t.includes("warn") || t.includes("amber") || t.includes("rate") || t.includes("429")) return "amber";
      if (t.includes("ollama") || t.includes("anthropic") || t.includes("claude")) return "cyan";
      return "green";
    };

    const fetchData = async () => {
      // 1. Notifications (broker fills, signals, alerts)
      try {
        const n = await api.notifications();
        const evs = n.events || [];
        for (const e of evs.slice(-10)) {
          const id = `${e.event_type}:${e.timestamp_utc}:${e.symbol || ""}`;
          if (seenIds.has(id)) continue;
          seenIds.add(id);
          const tag = String(e.event_type || "EVENT").toUpperCase();
          const sym = e.symbol ? ` ${e.symbol}` : "";
          const msg = (e as any).message ? ` · ${String((e as any).message).slice(0, 50)}` : "";
          renderQueue.push({
            text: `[${tag}]${sym}${msg}`,
            ts: stamp(),
            tone: detectTone(tag),
          });
        }
      } catch {}

      // 2. Memoria reciente (Tony aprende)
      try {
        const m = await api.memoryRecent(3);
        for (const item of m.items || []) {
          const id = `mem:${item.id}`;
          if (seenIds.has(id)) continue;
          seenIds.add(id);
          const tools = item.tools_used ? ` · ${item.tools_used.split(",")[0]}` : "";
          renderQueue.push({
            text: `[TONY] ${item.goal.slice(0, 60)}${tools}`,
            ts: stamp(),
            tone: item.status === "complete" ? "green" : "amber",
          });
        }
      } catch {}

      // 3. LLM provider snapshot (rotates each refresh)
      try {
        const p = await api.llmProviderStatus();
        if (p.ok) {
          const recent = (p as any).recent_sessions || [];
          for (const r of recent.slice(0, 2)) {
            const id = `llm:${r.session_id}`;
            if (seenIds.has(id)) continue;
            seenIds.add(id);
            renderQueue.push({
              text: `[${r.provider.toUpperCase()}] ${r.model} · ${r.iterations}iter · ${r.status}`,
              ts: stamp(),
              tone: r.provider === "groq" ? "green" : r.provider === "anthropic" ? "amber" : "cyan",
            });
          }
        }
      } catch {}

      // 4. n8n status snapshot (every refresh adds 1 line max)
      try {
        const w = await api.n8nWorkflowsStatus();
        if (w.ok) {
          const ex = (w as any).executions_24h || {};
          renderQueue.push({
            text: `[N8N] ${(w as any).active}/${(w as any).total} active · ${ex.success || 0} success · ${ex.error || 0} errors 24h`,
            ts: stamp(),
            tone: (ex.error || 0) > 0 ? "amber" : "green",
          });
        }
      } catch {}

      // 5. Periodic system snapshot (rotates fallback lines as filler)
      renderQueue.push({
        text: FALLBACK_LINES[snapshotIndex % FALLBACK_LINES.length],
        ts: stamp(),
        tone: "dim",
      });
      snapshotIndex++;
    };

    // Drip-feed lines from queue 1 every 1.6s for visual flow
    const drip = setInterval(() => {
      if (cancelled) return;
      if (renderQueue.length === 0) return;
      const next = renderQueue.shift()!;
      setLines((prev) => [...prev.slice(-14), next]);
    }, 1600);

    // Refresh data every 25s (queue keeps drip going)
    fetchData();
    const refresh = setInterval(fetchData, 25000);

    return () => {
      cancelled = true;
      clearInterval(drip);
      clearInterval(refresh);
    };
  }, []);

  const toneClass = (t: Line["tone"]) => ({
    green: "text-[var(--color-green)]",
    cyan: "text-[var(--color-cyan)]",
    amber: "text-[var(--color-amber)]",
    red: "text-[var(--color-red)]",
    dim: "text-[var(--color-text-dim)]",
  }[t]);

  return (
    <div className="matrix-stream max-h-72 overflow-y-auto px-3 py-2 bg-black/60 rounded border border-[var(--color-green)]/20 font-mono text-[10px] leading-relaxed">
      {lines.length === 0 && (
        <div className="text-[var(--color-text-dim)] py-2">Esperando eventos del sistema...</div>
      )}
      {lines.map((l, i) => (
        <div
          key={`${l.ts}-${i}`}
          className={toneClass(l.tone)}
          style={{ opacity: 0.45 + (i / lines.length) * 0.55 }}
        >
          <span className="text-[var(--color-text-dim)]">[{l.ts}]</span> {l.text}
        </div>
      ))}
      <div className="text-[var(--color-green)] animate-pulse">▊</div>
    </div>
  );
}
