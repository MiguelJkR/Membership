"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, MiniMetric } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Mail, AlertCircle, Inbox, Loader2, Play } from "lucide-react";

const URGENCY_COLOR: Record<string, string> = {
  high: "text-[var(--color-red)] border-[var(--color-red)]/40",
  medium: "text-[var(--color-amber)] border-[var(--color-amber)]/40",
  low: "text-[var(--color-text-dim)] border-[var(--color-text-dim)]/40",
};

const CATEGORY_COLOR: Record<string, string> = {
  consulta_cliente: "text-[var(--color-cyan)]",
  soporte: "text-[var(--color-cyan)]",
  spam: "text-[var(--color-text-dim)]",
  transaccional: "text-[var(--color-amber)]",
  financiero: "text-[var(--color-green)]",
  legal: "text-purple-400",
  ops: "text-orange-300",
  personal: "text-pink-400",
  otro: "text-[var(--color-text-dim)]",
};

export default function EmailPage() {
  const [drafts, setDrafts] = useState<any>({});
  const [inbox, setInbox] = useState<any>({});
  const [processing, setProcessing] = useState(false);

  async function load() {
    const [d, i] = await Promise.all([api.emailDrafts(), api.emailInboxSummary()]);
    setDrafts(d); setInbox(i);
  }

  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, []);

  async function processNow() {
    setProcessing(true);
    await api.emailProcess(15);
    await load();
    setProcessing(false);
  }

  const stats = drafts.stats || {};
  const byCategory = stats.by_category || {};
  const byUrgency = stats.by_urgency || {};

  return (
    <div className="p-5 space-y-4">
      <PageHeader
        title="Email · Integración Gmail"
        subtitle="contact@maclorianxgroup.com · IMAP + Groq clasificador + Ollama respaldo"
        action={
          <button
            onClick={processNow}
            disabled={processing}
            className="flex items-center gap-2 px-4 py-2 rounded border border-[var(--color-cyan)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/10 disabled:opacity-50 transition-colors"
          >
            {processing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            <span className="text-[10px] tracking-widest font-mono">PROCESAR BANDEJA</span>
          </button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MiniMetric label="BORRADORES PENDIENTES" value={`${drafts.count || 0}`} tone="cyan" />
        <MiniMetric label="ALTA URGENCIA" value={`${byUrgency.high || 0}`} tone="red" />
        <MiniMetric label="CONSULTAS" value={`${byCategory.consulta_cliente || 0}`} tone="green" />
        <MiniMetric label="TRANSACCIONAL" value={`${byCategory.transaccional || 0}`} />
        <MiniMetric label="SPAM" value={`${byCategory.spam || 0}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={`BORRADORES PENDIENTES · ${drafts.count || 0}`} glow="cyan">
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
            {(drafts.drafts || []).length > 0 ? (
              (drafts.drafts || []).map((d: any) => (
                <div key={d.uid} className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)] hover:border-[var(--color-border-bright)]">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[var(--color-text)] truncate flex-1">{d.subject}</span>
                    <span className={`shrink-0 text-[8px] tracking-widest px-2 py-0.5 rounded border font-mono ${URGENCY_COLOR[d.urgency] || URGENCY_COLOR.low}`}>
                      {(d.urgency || "low").toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[9px] text-[var(--color-text-dim)] font-mono mt-1 flex items-center gap-2">
                    <Mail size={10} />
                    <span className="truncate">{d.from}</span>
                    <span className={CATEGORY_COLOR[d.category] || ""}>· {d.category}</span>
                  </div>
                  {d.draft_body && (
                    <div className="mt-2 px-3 py-2 bg-[var(--color-cyan)]/5 border-l-2 border-[var(--color-cyan)] rounded text-[10px] text-[var(--color-text)] line-clamp-3">
                      {d.draft_body}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-[var(--color-green)] text-[11px] font-mono py-4">
                <Inbox size={14} />
                Sin borradores pendientes — todos los emails recientes son automatizados/spam
              </div>
            )}
          </div>
        </Card>

        <Card title={`BANDEJA RECIENTE · ${inbox.count || 0}`} glow="green">
          <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto">
            {(inbox.emails || []).slice(0, 20).map((e: any) => (
              <div key={e.uid} className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)] text-[10px]">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[var(--color-text)] truncate flex-1">{e.subject}</span>
                  {e.classification?.category && (
                    <span className={`shrink-0 text-[8px] tracking-widest font-mono ${CATEGORY_COLOR[e.classification.category] || ""}`}>
                      {e.classification.category}
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-[var(--color-text-dim)] font-mono truncate mt-0.5">{e.from}</div>
              </div>
            ))}
            {!(inbox.emails || []).length && (
              <div className="text-[10px] text-[var(--color-text-dim)] py-4 flex items-center gap-2">
                <AlertCircle size={12} />Bandeja vacía — click "PROCESAR BANDEJA" para refrescar
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card title="ARQUITECTURA DEL PIPELINE">
        <div className="overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max py-3">
            {["IMAP\nFETCH", "NO-REPLY\nHEURÍSTICA", "GROQ\nCLASIFICA", "OLLAMA\nRESPALDO", "BORRADOR\nGENERAR", "TELEGRAM\nALERTA"].map((step, i, arr) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-20 h-16 flex items-center justify-center text-center px-2 py-2 rounded border-2 border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/5 text-[9px] tracking-widest text-[var(--color-cyan)] font-mono whitespace-pre-line">
                  {step}
                </div>
                {i < arr.length - 1 && <div className="text-[var(--color-cyan)]/60">→</div>}
              </div>
            ))}
          </div>
          <div className="text-[9px] text-[var(--color-text-dim)] font-mono mt-2">
            Cron horario en n8n · Flujo id: H2YSiSYgXc2bSxMa · 100% confiabilidad vía wrapper LLM
          </div>
        </div>
      </Card>
    </div>
  );
}
