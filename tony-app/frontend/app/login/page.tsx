"use client";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Lock, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center text-[var(--color-cyan)] text-xs font-mono tracking-widest">CARGANDO...</div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError("");
    const result = await signIn("credentials", {
      username, password, redirect: false,
    });
    setLoading(false);
    if (result?.ok) {
      router.push(callbackUrl);
      router.refresh();
    } else {
      setError("Credenciales inválidas");
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-5 bg-[var(--color-bg)]">
      <div className="cyber-grid absolute inset-0 opacity-20 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo + brand */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-20 h-20 rounded border-2 border-[var(--color-cyan)] overflow-hidden bg-black flex items-center justify-center mb-3 glow-cyan">
            <Image src="/tony-character-1.png" alt="TONY" width={80} height={80} className="object-cover scale-150 opacity-90" priority />
          </div>
          <div className="text-[10px] font-mono tracking-[0.3em] text-[var(--color-cyan)]">WATCH_BOT</div>
          <div className="text-2xl font-bold text-[var(--color-text)]">TONY AI</div>
          <div className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono mt-1">CONFIABLE · EFICIENTE</div>
        </div>

        <form onSubmit={submit} className="rounded-lg border border-[var(--color-cyan)]/30 bg-[var(--color-bg-card)]/80 backdrop-blur p-6 glow-cyan space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={14} className="text-[var(--color-cyan)]" />
            <span className="text-[10px] tracking-widest text-[var(--color-cyan)] font-mono">AUTENTICACIÓN REQUERIDA</span>
          </div>

          <div>
            <label className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">USUARIO</label>
            <input
              type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              autoFocus required
              className="w-full mt-1 px-4 py-2 bg-black/60 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-cyan)]"
            />
          </div>

          <div>
            <label className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">CONTRASEÑA</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mt-1 px-4 py-2 bg-black/60 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-cyan)]"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[var(--color-red)] text-[11px] font-mono">
              <AlertCircle size={12} />{error}
            </div>
          )}

          <button
            type="submit" disabled={loading || !username || !password}
            className="w-full px-4 py-3 rounded bg-[var(--color-cyan)]/20 border border-[var(--color-cyan)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/40 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            <span className="text-[10px] tracking-widest font-mono">{loading ? "VERIFICANDO..." : "ACCEDER AL SISTEMA"}</span>
          </button>

          <div className="text-[9px] text-[var(--color-text-dim)] font-mono text-center pt-2 border-t border-[var(--color-border)]">
            JWT 7 días · Cookie segura HttpOnly · Cambiá password en .env.local
          </div>
        </form>

        <div className="text-center mt-4 text-[8px] tracking-widest text-[var(--color-text-dim)] font-mono">
          © 2026 MACLORIAN_X GROUP LLC · CAPE CORAL, FL
        </div>
      </div>
    </div>
  );
}
