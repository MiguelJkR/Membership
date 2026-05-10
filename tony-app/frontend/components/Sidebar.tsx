"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, TrendingUp, Bot, Workflow, BarChart3, Zap,
  Settings, Eye, ChevronLeft, ChevronRight, KeyRound, Webhook,
  Library, FileText, HelpCircle, Cog, Menu as MenuIcon, MessageCircle,
  Mail, Newspaper, Megaphone, Building2, Brain, ShieldCheck, Server,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; icon: any; label: string };
type NavSection = { title: string; items: NavItem[] };

// Full nav — 19 items grouped by purpose
const NAV_SECTIONS: NavSection[] = [
  {
    title: "PRINCIPAL",
    items: [
      { href: "/", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/chat", icon: MessageCircle, label: "Chat Tony" },
    ],
  },
  {
    title: "TRADING",
    items: [
      { href: "/trading", icon: TrendingUp, label: "Trading" },
      { href: "/watchlist", icon: Eye, label: "Watchlist" },
    ],
  },
  {
    title: "AUTOMATIZACIÓN",
    items: [
      { href: "/agents", icon: Bot, label: "Agentes" },
      { href: "/workflows", icon: Workflow, label: "Workflows" },
      { href: "/webhooks", icon: Webhook, label: "Webhooks" },
      { href: "/automation", icon: Zap, label: "Automatización" },
    ],
  },
  {
    title: "CONTENIDO",
    items: [
      { href: "/email", icon: Mail, label: "Email" },
      { href: "/news", icon: Newspaper, label: "Noticias" },
      { href: "/research", icon: Library, label: "Research" },
      { href: "/social-manager", icon: Megaphone, label: "Posts Sociales" },
      { href: "/social", icon: Eye, label: "Intel Social" },
    ],
  },
  {
    title: "EMPRESA",
    items: [
      { href: "/company", icon: Building2, label: "Empresa" },
      { href: "/analytics", icon: BarChart3, label: "Análisis" },
    ],
  },
  {
    title: "SISTEMA",
    items: [
      { href: "/system", icon: Server, label: "Diagnóstico" },
      { href: "/matrix", icon: Brain, label: "Modo Matrix" },
      { href: "/security", icon: ShieldCheck, label: "Seguridad" },
      { href: "/vault", icon: KeyRound, label: "Vault" },
      { href: "/settings", icon: Settings, label: "Configuración" },
      { href: "/news", icon: FileText, label: "Registros" },
      { href: "/chat", icon: HelpCircle, label: "Ayuda" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      if (w < 768) setCollapsed(true);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isItemActive = (item: NavItem) =>
    pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 p-2 rounded bg-[var(--color-bg-card)] border border-[var(--color-cyan)]/40 text-[var(--color-cyan)]"
        aria-label="Abrir menú"
      >
        <MenuIcon size={18} />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-card)]/95 backdrop-blur transition-all top-0 h-screen z-50",
          mobileOpen ? "fixed left-0 w-64" : "fixed -left-full w-64",
          "md:sticky md:left-0",
          collapsed ? "md:w-16" : "md:w-60",
        )}
      >
        {/* Logo block */}
        <div className="flex flex-col gap-2 p-4 border-b border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[var(--color-green)]/40 glow-green" />
              <div className="absolute inset-1 rounded-full border border-[var(--color-green)]/30" />
              <Cog size={20} className="text-[var(--color-green)] relative z-10" strokeWidth={1.5} />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-tight">
                <div className="text-xl font-bold tracking-wider text-[var(--color-text)] font-mono">TONY</div>
                <div className="text-[8px] tracking-[0.25em] text-[var(--color-text-dim)] font-mono">AI TRADING BOT</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="text-[8px] tracking-[0.3em] text-[var(--color-text-dim)] font-mono pt-2 border-t border-[var(--color-border)]/50">
              MACLORIAN <span className="text-[var(--color-green)]">X</span> GROUP
            </div>
          )}
        </div>

        {/* Nav sections — scrollable */}
        <nav className="flex flex-col flex-1 overflow-y-auto py-2">
          {NAV_SECTIONS.map((section, sIdx) => (
            <div key={section.title} className={cn("flex flex-col", sIdx > 0 && "mt-3")}>
              {/* Section title */}
              {!collapsed && (
                <div className="px-4 mb-1 text-[8px] tracking-[0.3em] font-mono text-[var(--color-text-dim)]/60 uppercase">
                  {section.title}
                </div>
              )}
              {collapsed && sIdx > 0 && (
                <div className="mx-2 my-1 border-t border-[var(--color-border)]/40" />
              )}
              {/* Items */}
              <div className="flex flex-col gap-0.5 px-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item);
                  return (
                    <Link
                      key={`${section.title}-${item.href}-${item.label}`}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-1.5 rounded transition-colors group relative",
                        isActive
                          ? "text-[var(--color-green)] bg-[var(--color-green)]/10"
                          : "text-[var(--color-text-dim)] hover:text-[var(--color-green)] hover:bg-[var(--color-green)]/5"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-[var(--color-green)] glow-green" />
                      )}
                      <Icon size={15} strokeWidth={1.5} className="shrink-0" />
                      {!collapsed && (
                        <span className="text-[11px] font-medium whitespace-nowrap flex-1 truncate">
                          {item.label}
                        </span>
                      )}
                      {!collapsed && isActive && (
                        <ChevronRight size={11} className="opacity-60" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer block — MODO MATRIX + version + collapse */}
        <div className="border-t border-[var(--color-border)] shrink-0">
          {!collapsed && (
            <Link
              href="/matrix"
              className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-green)]/5 transition-colors"
            >
              <div className="grid grid-cols-2 gap-0.5 shrink-0">
                <span className="w-1.5 h-1.5 bg-[var(--color-green)]/60 rounded-sm" />
                <span className="w-1.5 h-1.5 bg-[var(--color-green)] rounded-sm" />
                <span className="w-1.5 h-1.5 bg-[var(--color-green)] rounded-sm" />
                <span className="w-1.5 h-1.5 bg-[var(--color-green)]/60 rounded-sm" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] tracking-widest font-mono text-[var(--color-text)] font-semibold">MODO MATRIX</span>
                <span className="text-[8px] font-mono text-[var(--color-text-dim)]">v2.0.1 · n8n Automation</span>
              </div>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-full items-center justify-center gap-2 p-2 border-t border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-green)]"
          >
            {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span className="text-[9px] tracking-widest font-mono">COLAPSAR</span></>}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden w-full flex items-center justify-center gap-2 p-3 border-t border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-red)]"
          >
            <ChevronLeft size={14} />
            <span className="text-[9px] tracking-widest font-mono">CERRAR</span>
          </button>
        </div>
      </aside>
    </>
  );
}
