"use client";
import { Activity, Bell, User, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { api, fmt } from "@/lib/api";

export function TopBar() {
  const [aiStatus, setAiStatus] = useState<"online" | "offline" | "checking">("checking");
  const [capital, setCapital] = useState<number | undefined>();
  const [pl, setPl] = useState<number | undefined>();
  const [alerts, setAlerts] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function ping() {
      const pf = await api.portfolio();
      if (!mounted) return;
      if (pf.ok !== false) {
        setAiStatus("online");
        const real = pf.real_money_only || {};
        setCapital(real.total_value);
        setPl(real.total_pl);
      } else {
        setAiStatus("offline");
      }
      const notifications = await api.notifications();
      if (mounted) setAlerts(notifications.events?.length || 0);
    }
    ping();
    const interval = setInterval(ping, 45000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <header className="flex items-center justify-between gap-4 px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]/40 backdrop-blur sticky top-0 z-10">
      {/* Left: AI Status */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
          aiStatus === "online"
            ? "border-[var(--color-green)]/40 bg-[var(--color-green)]/10 text-[var(--color-green)]"
            : "border-[var(--color-red)]/40 bg-[var(--color-red)]/10 text-[var(--color-red)]"
        }`}>
          {aiStatus === "online" ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span className="text-[9px] tracking-widest font-mono">
            {aiStatus === "online" ? "SYSTEM ONLINE" : aiStatus === "offline" ? "SYSTEM OFFLINE" : "CHECKING..."}
          </span>
          {aiStatus === "online" && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-green)] animate-pulse" />}
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[var(--color-text-dim)]">
          <Activity size={12} />
          <span className="text-[9px] font-mono tracking-widest">AUTONOMOUS · MULTI-AGENT</span>
        </div>
      </div>

      {/* Center: Capital + P/L */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex flex-col items-end">
          <span className="text-[8px] tracking-widest text-[var(--color-text-dim)] font-mono">CAPITAL REAL</span>
          <span className="text-sm font-mono font-semibold text-[var(--color-cyan)]">{capital !== undefined ? fmt(capital) : "—"}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[8px] tracking-widest text-[var(--color-text-dim)] font-mono">P/L</span>
          <span className={`text-sm font-mono font-semibold ${pl !== undefined && pl >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]"}`}>
            {pl !== undefined ? fmt(pl) : "—"}
          </span>
        </div>
      </div>

      {/* Right: Alerts + Profile */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded text-[var(--color-text-dim)] hover:text-[var(--color-amber)] transition-colors">
          <Bell size={16} strokeWidth={1.5} />
          {alerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--color-red)] text-[8px] font-bold text-white flex items-center justify-center">
              {alerts > 9 ? "9+" : alerts}
            </span>
          )}
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded border border-[var(--color-border)] hover:border-[var(--color-cyan)]/40 transition-colors">
          <User size={12} className="text-[var(--color-cyan)]" />
          <span className="text-[10px] tracking-widest font-mono text-[var(--color-text)]">MIGUEL</span>
        </button>
      </div>
    </header>
  );
}
