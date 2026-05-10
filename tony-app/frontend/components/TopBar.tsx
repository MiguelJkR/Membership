"use client";
import { Activity, Bell, User, Wifi, WifiOff, Volume2, LogOut, Heart, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { api, fmt } from "@/lib/api";
import { signOut, useSession } from "next-auth/react";
import { VoiceModal } from "@/components/VoiceModal";
import { NotificationsPopover } from "@/components/NotificationsPopover";

export function TopBar() {
  const session = useSession();
  const userName = session.data?.user?.name?.split(" ")[0] || "MIGUEL";
  const [aiStatus, setAiStatus] = useState<"online" | "offline" | "checking">("checking");
  const [capital, setCapital] = useState<number | undefined>();
  const [pl, setPl] = useState<number | undefined>();
  const [alerts, setAlerts] = useState(0);
  const [healthScore, setHealthScore] = useState<number | undefined>();
  const [errorCount24h, setErrorCount24h] = useState<number>(0);
  const [uptimeStartTs, setUptimeStartTs] = useState<number | undefined>();
  const [uptimeNow, setUptimeNow] = useState<number>(0);
  const [showVoice, setShowVoice] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Live uptime tick (every second once we know start_ts)
  useEffect(() => {
    if (!uptimeStartTs) return;
    const tick = () => setUptimeNow(Math.floor(Date.now() / 1000) - uptimeStartTs);
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [uptimeStartTs]);

  function formatUptime(s: number): string {
    if (s < 0) return "—";
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  }

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
      // Health composite + n8n error count
      try {
        const sys = await api.systemStatus();
        if (mounted) setHealthScore(sys.health?.composite_score);
      } catch {}
      try {
        const errs = await api.n8nErrors();
        if (mounted) setErrorCount24h(errs.total_errors_last_30 || 0);
      } catch {}
      // Uptime — fetch start_ts once
      if (!uptimeStartTs) {
        try {
          const u = await api.uptime();
          if (mounted) setUptimeStartTs(u.start_ts);
        } catch {}
      }
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
            {aiStatus === "online" ? "SISTEMA EN LÍNEA" : aiStatus === "offline" ? "SISTEMA OFFLINE" : "VERIFICANDO..."}
          </span>
          {aiStatus === "online" && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-green)] animate-pulse" />}
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[var(--color-text-dim)]">
          <Activity size={12} />
          <span className="text-[9px] font-mono tracking-widest">AUTÓNOMO · MULTI-AGENTE</span>
        </div>
        {/* Health badge */}
        {healthScore !== undefined && (
          <div
            className={`hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full border ${
              healthScore >= 80
                ? "border-[var(--color-green)]/40 bg-[var(--color-green)]/5 text-[var(--color-green)]"
                : healthScore >= 60
                ? "border-[var(--color-amber)]/40 bg-[var(--color-amber)]/5 text-[var(--color-amber)]"
                : "border-[var(--color-red)]/40 bg-[var(--color-red)]/5 text-[var(--color-red)]"
            }`}
            title={`Sistema health composite + n8n errores 24h`}
          >
            <Heart size={10} strokeWidth={2} />
            <span className="text-[9px] tracking-widest font-mono font-semibold">{healthScore}/100</span>
            {errorCount24h > 0 && (
              <span className="text-[8px] font-mono opacity-70">· {errorCount24h}err</span>
            )}
          </div>
        )}
        {/* UPTIME counter (live tick) */}
        {uptimeStartTs && (
          <div
            className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-full border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/5 text-[var(--color-cyan)]"
            title="Backend uptime"
          >
            <Clock size={10} strokeWidth={2} />
            <span className="text-[9px] tracking-widest font-mono font-semibold tabular-nums">
              UPTIME {formatUptime(uptimeNow)}
            </span>
          </div>
        )}
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

      {/* Right: Voice + Alerts + Profile */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowVoice(true)}
          className="p-2 rounded text-[var(--color-text-dim)] hover:text-[var(--color-green)] hover:bg-[var(--color-green)]/10 transition-colors"
          title="Tony habla (TTS spanish)"
        >
          <Volume2 size={16} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => setShowNotifications(true)}
          className="relative p-2 rounded text-[var(--color-text-dim)] hover:text-[var(--color-amber)] hover:bg-[var(--color-amber)]/10 transition-colors"
          title="Notificaciones"
        >
          <Bell size={16} strokeWidth={1.5} />
          {alerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--color-red)] text-[8px] font-bold text-white flex items-center justify-center animate-pulse">
              {alerts > 9 ? "9+" : alerts}
            </span>
          )}
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded border border-[var(--color-border)] hover:border-[var(--color-cyan)]/40 transition-colors">
          <User size={12} className="text-[var(--color-cyan)]" />
          <span className="text-[10px] tracking-widest font-mono text-[var(--color-text)]">{userName.toUpperCase()}</span>
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 rounded text-[var(--color-text-dim)] hover:text-[var(--color-red)] transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={16} strokeWidth={1.5} />
        </button>
      </div>

      {showVoice && <VoiceModal onClose={() => setShowVoice(false)} />}
      {showNotifications && <NotificationsPopover onClose={() => setShowNotifications(false)} />}
    </header>
  );
}
