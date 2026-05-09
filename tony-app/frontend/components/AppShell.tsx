"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { TickerTape } from "@/components/TickerTape";
import { PageTransition } from "@/components/PageTransition";

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
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <TickerTape />
        <main className="flex-1 overflow-y-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
