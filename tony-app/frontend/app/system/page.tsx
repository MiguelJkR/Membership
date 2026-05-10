"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Cpu, HardDrive, MemoryStick, Activity, RefreshCw, FileText,
  Loader2, ChevronRight, Zap, AlertTriangle, CheckCircle2, Server,
} from "lucide-react";

const LOG_SOURCES = [
  { key: "flask", label: "Flask" },
  { key: "watchdog", label: "Watchdog" },
  { key: "cloudflared", label: "Tunnel" },
  { key: "next", label: "Next.js" },
  { key: "n8n", label: "n8n" },
  { key: "tony_brief", label: "Boot script" },
];

export default function SystemPage() {
  const [diag, setDiag] = useState<any>(null);
  const [logs, setLogs] = useState<{ source: string; lines: string[]; path?: string }>({ source: "flask", lines: [] });
  const [logSource, setLogSource] = useState("flask");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const r = await api.systemDiagnostics();
      if (r.ok) setDiag(r);
    } catch {}
    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadLogs = async () => {
      try {
        const r = await api.systemLogs(logSource, 50);
        if (!cancelled && r.ok) setLogs({ source: r.source, lines: r.lines, path: r.path });
      } catch {}
    };
    loadLogs();
    const i = setInterval(loadLogs, 10000);
    return () => { cancelled = true; clearInterval(i); };
  }, [logSource]);

  if (loading || !diag) {
    return (
      <div className="p-6 flex items-center justify-center text-[var(--color-text-dim)]">
        <Loader2 size={14} className="animate-spin mr-2" /> cargando diagnóstico...
      </div>
    );
  }

  const mem = diag.memory || {};
  const cpu = diag.cpu || {};
  const disks: any[] = diag.disks || [];
  const procs: any[] = diag.processes || [];
  const lat: Record<string, number | null> = diag.endpoint_latencies_ms || {};
  const ramTone = mem.used_pct > 85 ? "red" : mem.used_pct > 70 ? "amber" : "green";
  const cpuTone = cpu.percent_avg > 80 ? "red" : cpu.percent_avg > 60 ? "amber" : "green";
  const tonePalette = (t: string) => ({
    green: "text-[var(--color-green)]",
    amber: "text-[var(--color-amber)]",
    red: "text-[var(--color-red)]",
  }[t] || "text-[var(--color-text)]");
  const toneBar = (t: string) => ({
    green: "bg-[var(--color-green)]",
    amber: "bg-[var(--color-amber)]",
    red: "bg-[var(--color-red)]",
  }[t] || "bg-[var(--color-text-dim)]");

  return (
    <div className="p-4 md:p-5 space-y-4">
      {/* Subheader */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/60 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Server size={14} className="text-[var(--color-green)]" />
            <span className="text-[10px] tracking-[0.3em] font-mono text-[var(--color-text-dim)]">
              SYSTEM MONITORING · DIAGNÓSTICO PROFUNDO · AUTO-REFRESH 30s
            </span>
          </div>
          <button
            onClick={load}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-widest font-mono rounded border border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10 text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/20 transition disabled:opacity-50"
          >
            {refreshing ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            REFRESH
          </button>
        </div>
      </div>

      {/* Top-line resources: RAM + CPU + disks side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* RAM */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MemoryStick size={14} className={tonePalette(ramTone)} />
              <span className="text-[11px] tracking-[0.25em] font-mono font-semibold">RAM</span>
            </div>
            <span className={`text-[9px] tracking-widest font-mono ${tonePalette(ramTone)}`}>
              {ramTone === "green" ? "OK" : ramTone === "amber" ? "WARN" : "CRITICAL"}
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[var(--color-text)]">
            {mem.used_gb}<span className="text-[var(--color-text-dim)] text-base">/{mem.total_gb}GB</span>
          </div>
          <div className="text-[10px] font-mono text-[var(--color-text-dim)] mb-2">
            {mem.available_gb}GB libres · {mem.used_pct}% used
          </div>
          <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
            <div className={`h-full transition-all ${toneBar(ramTone)}`} style={{ width: `${mem.used_pct}%` }} />
          </div>
        </div>

        {/* CPU */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu size={14} className={tonePalette(cpuTone)} />
              <span className="text-[11px] tracking-[0.25em] font-mono font-semibold">CPU</span>
            </div>
            <span className={`text-[9px] tracking-widest font-mono ${tonePalette(cpuTone)}`}>
              {cpuTone === "green" ? "IDLE" : cpuTone === "amber" ? "BUSY" : "MAX"}
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[var(--color-text)]">
            {cpu.percent_avg}<span className="text-[var(--color-text-dim)] text-base">%</span>
          </div>
          <div className="text-[10px] font-mono text-[var(--color-text-dim)] mb-2">
            {cpu.cores_logical} threads · {cpu.cores_physical} cores físicos
          </div>
          <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
            <div className={`h-full transition-all ${toneBar(cpuTone)}`} style={{ width: `${Math.min(100, cpu.percent_avg)}%` }} />
          </div>
        </div>

        {/* Disks */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 p-5">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive size={14} className="text-[var(--color-cyan)]" />
            <span className="text-[11px] tracking-[0.25em] font-mono font-semibold">DISCOS</span>
          </div>
          <div className="space-y-2">
            {disks.map((d) => {
              const t = d.used_pct > 90 ? "red" : d.used_pct > 80 ? "amber" : "green";
              return (
                <div key={d.label}>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[var(--color-text)]">{d.label}</span>
                    <span className={tonePalette(t)}>
                      {d.used_gb}/{d.total_gb}GB · {d.used_pct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden mt-1">
                    <div className={`h-full ${toneBar(t)}`} style={{ width: `${d.used_pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Processes table + Endpoint latencies side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Processes */}
        <div className="lg:col-span-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 p-5">
          <h3 className="text-[11px] tracking-[0.25em] font-mono text-[var(--color-text)] font-semibold mb-3 flex items-center gap-2">
            <Activity size={12} className="text-[var(--color-green)]" />
            PROCESOS TONY AI · {procs.length} ACTIVOS
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="text-[8px] tracking-[0.25em] text-[var(--color-text-dim)] border-b border-[var(--color-border)]">
                  <th className="text-left py-1.5 px-2">PID</th>
                  <th className="text-left py-1.5 px-2">SERVICIO</th>
                  <th className="text-right py-1.5 px-2">RAM</th>
                  <th className="text-right py-1.5 px-2">CPU</th>
                  <th className="text-right py-1.5 px-2">UPTIME</th>
                </tr>
              </thead>
              <tbody>
                {procs.map((p) => (
                  <tr key={p.pid} className="border-b border-[var(--color-border)]/30 hover:bg-white/[0.02]">
                    <td className="py-1.5 px-2 text-[var(--color-text-dim)] tabular-nums">{p.pid}</td>
                    <td className="py-1.5 px-2 text-[var(--color-text)]">
                      {p.label}
                      <span className="text-[8px] text-[var(--color-text-dim)] ml-1.5">({p.name})</span>
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      <span className={p.ram_mb > 200 ? "text-[var(--color-amber)]" : "text-[var(--color-text)]"}>
                        {p.ram_mb}MB
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-[var(--color-text-dim)]">
                      {p.cpu_pct.toFixed(1)}%
                    </td>
                    <td className="py-1.5 px-2 text-right text-[var(--color-text-dim)]">{p.uptime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Endpoint latencies */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 p-5">
          <h3 className="text-[11px] tracking-[0.25em] font-mono text-[var(--color-text)] font-semibold mb-3 flex items-center gap-2">
            <Zap size={12} className="text-[var(--color-amber)]" />
            LATENCIAS API
          </h3>
          <div className="space-y-1.5">
            {Object.entries(lat).map(([ep, ms]) => {
              const ok = ms !== null && ms !== undefined;
              const tone = !ok ? "red" : (ms as number) > 1000 ? "amber" : "green";
              return (
                <div key={ep} className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[var(--color-text-dim)]">{ep}</span>
                  <span className={tonePalette(tone)}>
                    {ok ? `${ms}ms` : "TIMEOUT"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Logs viewer */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h3 className="text-[11px] tracking-[0.25em] font-mono text-[var(--color-text)] font-semibold flex items-center gap-2">
            <FileText size={12} className="text-[var(--color-cyan)]" />
            LOGS EN VIVO · {logs.lines.length} líneas
          </h3>
          <div className="flex flex-wrap gap-1">
            {LOG_SOURCES.map((s) => (
              <button
                key={s.key}
                onClick={() => setLogSource(s.key)}
                className={`px-2.5 py-1 text-[9px] tracking-widest font-mono rounded border transition ${
                  logSource === s.key
                    ? "border-[var(--color-cyan)] bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]"
                    : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-cyan)]/40"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-black/60 rounded border border-[var(--color-border)] p-3 font-mono text-[10px] leading-relaxed max-h-96 overflow-y-auto">
          {logs.lines.length === 0 ? (
            <div className="text-[var(--color-text-dim)]">
              Log vacío o no encontrado. Path: <code>{logs.path || "(unknown)"}</code>
            </div>
          ) : (
            logs.lines.map((line, i) => {
              const isError = /error|fail|except|traceback|critical/i.test(line);
              const isWarn = /warn|alert|429|timeout/i.test(line);
              const tone = isError ? "text-[var(--color-red)]" : isWarn ? "text-[var(--color-amber)]" : "text-[var(--color-text-dim)]";
              return (
                <div key={i} className={tone}>
                  <span className="text-[var(--color-text-dim)]/50 mr-2">{(i + 1).toString().padStart(3, "0")}</span>
                  {line || " "}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
