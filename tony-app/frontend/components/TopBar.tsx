"use client";
import { Bell, Volume2, LogOut, Heart, Clock, Search, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { api, fmt } from "@/lib/api";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { VoiceModal } from "@/components/VoiceModal";
import { NotificationsPopover } from "@/components/NotificationsPopover";

const ROUTE_TITLES: Record<string, string> = {
  "/": "DASHBOARD",
  "/trading": "TRADING",
  "/agents": "AGENTES",
  "/workflows": "WORKFLOWS",
  "/analytics": "ANÁLISIS",
  "/automation": "AUTOMATIZACIÓN",
  "/webhooks": "WEBHOOKS",
  "/research": "RESEARCH",
  "/vault": "VAULT",
  "/watchlist": "WATCHLIST",
  "/settings": "CONFIGURACIÓN",
  "/news": "REGISTROS",
  "/chat": "AYUDA",
  "/system": "DIAGNÓSTICO",
};

export function TopBar() {
  const pathname = usePathname();
  const session = useSession();
  const [pl, setPl] = useState<number | undefined>();
  const [alerts, setAlerts] = useState(0);
  const [healthScore, setHealthScore] = useState<number | undefined>();
  const [uptimeStartTs, setUptimeStartTs] = useState<number | undefined>();
  const [uptimeNow, setUptimeNow] = useState<number>(0);
  const [showVoice, setShowVoice] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [now, setNow] = useState<string>("");

  // Live clock tick
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = d.getHours().toString().padStart(2, "0");
      const mm = d.getMinutes().toString().padStart(2, "0");
      const ss = d.getSeconds().toString().padStart(2, "0");
      setNow(`${hh}:${mm}:${ss}`);
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  // Live uptime tick
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
      try {
        const pf = await api.portfolio();
        if (!mounted) return;
        const real = pf.real_money_only || {};
        setPl(real.total_pl);
      } catch {}
      try {
        const notifications = await api.notifications();
        if (mounted) setAlerts(notifications.events?.length || 0);
      } catch {}
      try {
        const sys = await api.systemStatus();
        if (mounted) setHealthScore(sys.health?.composite_score);
      } catch {}
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

  const routeTitle = ROUTE_TITLES[pathname] || pathname.replace("/", "").toUpperCase() || "DASHBOARD";

  return (
    <header className="flex items-center gap-4 px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]/40 backdrop-blur sticky top-0 z-10">
      {/* Left: Breadcrumb TONY-OS / DASHBOARD / "/" */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] tracking-[0.25em] font-mono text-[var(--color-text-dim)]">TONY-OS</span>
        <ChevronRight size={11} className="text-[var(--color-text-dim)]/50" />
        <span className="text-[10px] tracking-[0.25em] font-mono text-[var(--color-green)] font-semibold">{routeTitle}</span>
        <span className="ml-2 px-2 py-0.5 rounded border border-[var(--color-border)] text-[10px] font-mono text-[var(--color-text-dim)]">/</span>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-xl mx-auto hidden md:block">
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" />
          <input
            type="text"
            placeholder="Para abrir la pantalla completa..."
            className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-[var(--color-border)] rounded text-[10px] font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-green)]/50 placeholder:text-[var(--color-text-dim)]"
          />
        </div>
      </div>

      {/* Right block: pills + voice + bell + clock */}
      <div className="flex items-center gap-3 shrink-0">
        {/* UPTIME pill */}
        {uptimeStartTs && (
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono">
            <Clock size={10} className="text-[var(--color-text-dim)]" />
            <span className="tracking-widest text-[var(--color-text-dim)]">UPTIME</span>
            <span className="text-[var(--color-text)] tabular-nums">{formatUptime(uptimeNow)}</span>
          </div>
        )}
        {/* P&L pill */}
        {pl !== undefined && (
          <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono">
            <span className="tracking-widest text-[var(--color-text-dim)]">P&L 24H</span>
            <span className={pl >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]"}>
              {pl >= 0 ? "+" : ""}{fmt(pl)}
            </span>
          </div>
        )}
        {/* HEALTH pill */}
        {healthScore !== undefined && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono ${
              healthScore >= 80
                ? "border-[var(--color-green)]/40 bg-[var(--color-green)]/10 text-[var(--color-green)]"
                : healthScore >= 60
                ? "border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10 text-[var(--color-amber)]"
                : "border-[var(--color-red)]/40 bg-[var(--color-red)]/10 text-[var(--color-red)]"
            }`}
          >
            <Heart size={10} strokeWidth={2} />
            <span className="tracking-widest font-semibold">HEALTH {healthScore}%</span>
          </div>
        )}

        {/* Voice button */}
        <button
          onClick={() => setShowVoice(true)}
          className="p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-green)] hover:bg-[var(--color-green)]/10 transition-colors"
          title="Tony habla (TTS)"
        >
          <Volume2 size={14} strokeWidth={1.5} />
        </button>

        {/* Bell */}
        <button
          onClick={() => setShowNotifications(true)}
          className="relative p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-amber)] hover:bg-[var(--color-amber)]/10 transition-colors"
          title="Notificaciones"
        >
          <Bell size={14} strokeWidth={1.5} />
          {alerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--color-red)] animate-pulse" />
          )}
        </button>

        {/* Clock */}
        <span className="text-[12px] tracking-wider font-mono text-[var(--color-green)] tabular-nums hidden sm:inline">
          {now}
        </span>

        {/* User logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-red)] transition-colors"
          title={`Cerrar sesión (${session.data?.user?.name || ""})`}
        >
          <LogOut size={14} strokeWidth={1.5} />
        </button>
      </div>

      {showVoice && <VoiceModal onClose={() => setShowVoice(false)} />}
      {showNotifications && <NotificationsPopover onClose={() => setShowNotifications(false)} />}
    </header>
  );
}
