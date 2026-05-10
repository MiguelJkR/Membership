"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { TickerTape } from "@/components/TickerTape";
import { TickerTapeV2 } from "@/components/TickerTapeV2";
import { PageTransition } from "@/components/PageTransition";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

/** Wraps children with Sidebar+TopBar+TickerTape, except for auth pages. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/login");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-full flex w-full">
      <Sidebar />
      {/* Push content right on desktop only — sidebar is fixed/drawer on mobile */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Spacer for mobile hamburger button — only on small screens */}
        <div className="md:hidden h-12" />
        <TopBar />
        <TickerTapeV2 />
        <TickerTape />
        <main className="flex-1 overflow-y-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <PWAInstallPrompt />
    </div>
  );
}
