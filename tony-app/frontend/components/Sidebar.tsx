"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, TrendingUp, Bot, Workflow, Zap, BarChart3,
  ShieldCheck, Settings, Brain, Eye, ChevronLeft, ChevronRight,
  Mail, MessageCircle, Library, Newspaper, Building2, Megaphone
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", icon: LayoutDashboard, label: "DASHBOARD" },
  { href: "/chat", icon: MessageCircle, label: "TONY CHAT" },
  { href: "/company", icon: Building2, label: "COMPANY" },
  { href: "/social-manager", icon: Megaphone, label: "SOCIAL POST" },
  { href: "/trading", icon: TrendingUp, label: "TRADING" },
  { href: "/agents", icon: Bot, label: "AI AGENTS" },
  { href: "/workflows", icon: Workflow, label: "WORKFLOWS" },
  { href: "/email", icon: Mail, label: "EMAIL" },
  { href: "/news", icon: Newspaper, label: "NEWS" },
  { href: "/research", icon: Library, label: "RESEARCH" },
  { href: "/matrix", icon: Brain, label: "MATRIX MODE" },
  { href: "/social", icon: Eye, label: "SOCIAL INTEL" },
  { href: "/analytics", icon: BarChart3, label: "ANALYTICS" },
  { href: "/security", icon: ShieldCheck, label: "SECURITY" },
  { href: "/automation", icon: Zap, label: "AUTOMATION" },
  { href: "/settings", icon: Settings, label: "SETTINGS" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-card)]/60 backdrop-blur transition-all sticky top-0 h-screen",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)]">
        <div className="relative w-9 h-9 rounded border-2 border-[var(--color-cyan)] overflow-hidden bg-black flex items-center justify-center shrink-0">
          <Image src="/tony-character-1.png" alt="TONY" width={36} height={36} className="object-cover scale-150 opacity-90" priority />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <div className="text-[9px] font-mono tracking-[0.3em] text-[var(--color-cyan)]">WATCH_BOT</div>
            <div className="text-sm font-bold text-[var(--color-text)]">TONY AI</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded transition-colors",
                isActive
                  ? "text-[var(--color-cyan)] bg-[var(--color-cyan)]/10 glow-cyan"
                  : "text-[var(--color-text-dim)] hover:text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/5"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={16} strokeWidth={1.5} className="shrink-0" />
              {!collapsed && (
                <span className="text-[10px] tracking-widest font-mono whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center gap-2 p-3 border-t border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-cyan)]"
      >
        {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span className="text-[9px] tracking-widest font-mono">COLLAPSE</span></>}
      </button>
    </aside>
  );
}
