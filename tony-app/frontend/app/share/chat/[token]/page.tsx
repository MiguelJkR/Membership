"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Bot, User, AlertTriangle, Lock, ExternalLink, Calendar, Eye, MessageCircle, Sparkles, Zap, Cpu, Brain } from "lucide-react";

type ShareMsg = {
  role: "user" | "tony" | "system_alert";
  text: string;
  ts: string;
  source?: string;
  model?: string;
  specialist?: { name: string; matched_keyword: string };
  alert_priority?: string;
  image_count?: number;
};

type Share = {
  ok: boolean;
  token?: string;
  title?: string;
  author?: string;
  created_at?: string;
  expires_at?: string;
  message_count?: number;
  view_count?: number;
  messages?: ShareMsg[];
  error?: string;
};

const PROVIDER_META: Record<string, { label: string; icon: any; color: string }> = {
  anthropic: { label: "Claude Sonnet 4.5", icon: Sparkles, color: "text-amber-400" },
  groq: { label: "Groq", icon: Zap, color: "text-emerald-400" },
  ollama: { label: "Ollama", icon: Cpu, color: "text-cyan-400" },
  ollama_local: { label: "Ollama", icon: Cpu, color: "text-cyan-400" },
  llm: { label: "LLM", icon: Brain, color: "text-slate-400" },
  init: { label: "Sistema", icon: Bot, color: "text-slate-400" },
};

export default function ShareChatPage() {
  const params = useParams();
  const token = String(params?.token || "");
  const [data, setData] = useState<Share | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/chat/share/${encodeURIComponent(token)}`)
      .then(async (r) => {
        const j = await r.json();
        setData({ ...j, ok: r.ok && j.ok });
      })
      .catch((e) => setData({ ok: false, error: String(e) }))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--color-text-dim)]">
          <div className="w-2 h-2 rounded-full bg-[var(--color-amber)] animate-pulse" />
          <span className="font-mono text-xs tracking-widest">CARGANDO CONVERSACIÓN...</span>
        </div>
      </div>
    );
  }

  if (!data?.ok) {
    const isExpired = data?.error === "expired";
    const isRevoked = data?.error === "revoked";
    return (
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center">
          <Lock size={32} className="mx-auto mb-4 text-[var(--color-text-dim)]" />
          <h1 className="text-lg font-bold mb-2">
            {isExpired ? "Link expirado" : isRevoked ? "Link revocado" : "No encontrado"}
          </h1>
          <p className="text-sm text-[var(--color-text-dim)] mb-4">
            {isExpired
              ? "Este link de conversación ya expiró. Pedile uno nuevo al dueño."
              : isRevoked
              ? "Este link fue revocado y ya no está accesible."
              : "El link es inválido o no existe."}
          </p>
          <a
            href="https://maclorianxgroup.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono tracking-widest text-[var(--color-amber)] hover:underline"
          >
            MacLorian X Group <ExternalLink size={11} />
          </a>
        </div>
      </div>
    );
  }

  const expiresFmt = data.expires_at ? new Date(data.expires_at).toLocaleString("es-AR") : "";
  const createdFmt = data.created_at ? new Date(data.created_at).toLocaleString("es-AR") : "";

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-card)]/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <MessageCircle size={16} className="text-[var(--color-amber)] shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{data.title || "Conversación con Tony"}</div>
              <div className="text-[10px] tracking-widest font-mono text-[var(--color-text-dim)] uppercase">
                Compartido por {data.author || "Miguel"} · {data.message_count} mensajes · Read-only
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-mono tracking-widest text-[var(--color-text-dim)]">
            <span className="flex items-center gap-1" title={`Creado ${createdFmt}`}>
              <Calendar size={10} /> {createdFmt.slice(0, 16)}
            </span>
            {typeof data.view_count === "number" && (
              <span className="flex items-center gap-1" title={`${data.view_count} vistas`}>
                <Eye size={10} /> {data.view_count}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {(data.messages || []).map((m, i) => {
          if (m.role === "system_alert") {
            const isCrit = m.alert_priority === "critical";
            const isHi = m.alert_priority === "high";
            const color = isCrit ? "red" : isHi ? "amber" : "cyan";
            return (
              <div
                key={i}
                className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 ${
                  isCrit
                    ? "border-red-500/40 bg-red-500/10 text-red-300"
                    : isHi
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    : "border-cyan-500/30 bg-cyan-500/5 text-cyan-200"
                }`}
              >
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <div className="font-mono tracking-widest opacity-70 text-[9px]">
                    SISTEMA · {(m.alert_priority || "INFO").toUpperCase()} · {m.ts.slice(11, 19)}
                  </div>
                  <div className="mt-1">{m.text}</div>
                </div>
              </div>
            );
          }
          if (m.role === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-lg bg-[var(--color-amber)]/10 border border-[var(--color-amber)]/30 px-3 py-2">
                  <div className="flex items-center gap-1.5 mb-1 text-[9px] font-mono tracking-widest text-[var(--color-amber)] opacity-70">
                    <User size={9} /> {data.author?.toUpperCase() || "MIGUEL"} · {m.ts.slice(11, 19)}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                  {m.image_count ? (
                    <div className="mt-1 text-[10px] font-mono text-[var(--color-text-dim)] italic">
                      [{m.image_count} imagen(es) — no incluidas en share]
                    </div>
                  ) : null}
                </div>
              </div>
            );
          }
          // Tony
          const meta = PROVIDER_META[m.source || "llm"] || PROVIDER_META.llm;
          const Icon = meta.icon;
          return (
            <div key={i} className="flex justify-start">
              <div className="max-w-[90%] rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1 text-[9px] font-mono tracking-widest opacity-70">
                  <Bot size={9} className={meta.color} />
                  <span className={meta.color}>TONY</span>
                  <span className="text-[var(--color-text-dim)]">·</span>
                  <Icon size={9} className={meta.color} />
                  <span className={meta.color}>{meta.label}</span>
                  {m.specialist && (
                    <>
                      <span className="text-[var(--color-text-dim)]">·</span>
                      <span className="text-[var(--color-purple)]">🧠 {m.specialist.name}</span>
                    </>
                  )}
                  <span className="text-[var(--color-text-dim)] ml-auto">{m.ts.slice(11, 19)}</span>
                </div>
                <div className="text-sm">{renderMarkdown(m.text)}</div>
              </div>
            </div>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-4 mt-4">
        <div className="max-w-3xl mx-auto px-4 text-center text-[9px] font-mono tracking-widest text-[var(--color-text-dim)] space-y-1">
          <div>
            Compartido por{" "}
            <a href="https://maclorianxgroup.com" target="_blank" rel="noopener noreferrer" className="text-[var(--color-amber)] hover:underline">
              TONY AI · MacLorian X Group
            </a>
          </div>
          <div>Expira: {expiresFmt} · Read-only · El dueño puede revocar este link</div>
        </div>
      </footer>
    </div>
  );
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, idx) => {
        if (line.startsWith("### "))
          return <div key={idx} className="text-[var(--color-amber)] font-bold text-[14px] mt-2 mb-1">{renderInline(line.slice(4))}</div>;
        if (line.startsWith("## "))
          return <div key={idx} className="text-[var(--color-amber)] font-bold text-[15px] mt-3 mb-1.5">{renderInline(line.slice(3))}</div>;
        if (line.startsWith("# "))
          return <div key={idx} className="text-[var(--color-amber)] font-bold text-[16px] mt-3 mb-2">{renderInline(line.slice(2))}</div>;
        if (/^[-*•]\s/.test(line))
          return (
            <div key={idx} className="flex gap-2 pl-2">
              <span className="text-[var(--color-amber)] shrink-0">•</span>
              <span>{renderInline(line.replace(/^[-*•]\s/, ""))}</span>
            </div>
          );
        if (/^---+$/.test(line.trim())) return <hr key={idx} className="border-[var(--color-border)] my-2" />;
        if (!line.trim()) return <div key={idx} className="h-1.5" />;
        if (line.includes("<!--")) return null;
        return <div key={idx}>{renderInline(line)}</div>;
      })}
    </>
  );
}

function renderInline(text: string) {
  const parts: any[] = [];
  let lastIdx = 0;
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let match;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={i++} className="text-[var(--color-text)] font-bold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`")) {
      parts.push(
        <code key={i++} className="text-[var(--color-amber)] font-mono text-[12px] bg-black/40 px-1 rounded">
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts.length > 0 ? <>{parts}</> : text;
}
