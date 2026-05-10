"use client";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let didReload = false;
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((reg) => {
        intervalId = setInterval(() => reg.update().catch(() => {}), 10 * 60_000);
        reg.addEventListener("updatefound", () => {
          const w = reg.installing;
          if (!w) return;
          w.addEventListener("statechange", () => {
            if (w.state === "installed" && navigator.serviceWorker.controller) {
              w.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (didReload) return;
          didReload = true;
          window.location.reload();
        });
      })
      .catch(() => {});
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);
  return null;
}
