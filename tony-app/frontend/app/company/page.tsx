"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, MiniMetric } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Globe, ExternalLink, AlertCircle, CheckCircle2, Building2, Banknote, FileText, Mail } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  LIVE: "text-[var(--color-green)] border-[var(--color-green)]/40 bg-[var(--color-green)]/10",
  WIP: "text-[var(--color-amber)] border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10",
  DOWN: "text-[var(--color-red)] border-[var(--color-red)]/40 bg-[var(--color-red)]/10",
};

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: "text-[var(--color-red)] border-[var(--color-red)]",
  MEDIUM: "text-[var(--color-amber)] border-[var(--color-amber)]",
  LOW: "text-[var(--color-text-dim)] border-[var(--color-text-dim)]",
};

export default function CompanyPage() {
  const [data, setData] = useState<any>({});

  useEffect(() => { api.company().then(setData); }, []);

  const c = data.company || {};
  const products = data.products || [];
  const infra = data.infrastructure || {};
  const items = data.pending_action_items || [];
  const handles = data.social_handles || {};

  const liveCount = products.filter((p: any) => p.status === "LIVE").length;
  const highPriority = items.filter((i: any) => i.priority === "HIGH").length;

  return (
    <div className="p-5 space-y-4">
      <PageHeader title="Control de Empresa" subtitle={`${c.legal_name || "—"} · FUNDADOR ${c.founder || "—"} · ${c.location || "—"}`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniMetric label="PRODUCTOS EN VIVO" value={`${liveCount}/${products.length}`} tone="green" />
        <MiniMetric label="PENDIENTES URGENTES" value={`${highPriority}`} tone={highPriority > 0 ? "red" : "green"} />
        <MiniMetric label="FLUJOS N8N" value={String(infra.n8n_workflows || "—").replace(" active", "")} tone="cyan" />
        <MiniMetric label="EIN" value={c.ein || "—"} tone="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="PRODUCTOS · 5 LÍNEAS" glow="green">
          <div className="flex flex-col gap-2">
            {products.map((p: any) => (
              <div key={p.id} className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--color-text)]">{p.name}</span>
                      <span className={`text-[8px] tracking-widest px-2 py-0.5 rounded border font-mono ${STATUS_COLOR[p.status]}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="text-[9px] text-[var(--color-text-dim)] font-mono">{p.audience}</div>
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-1 text-[10px] text-[var(--color-cyan)] hover:underline mt-1">
                        <Globe size={10} />{p.url}
                        <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[8px] text-[var(--color-text-dim)] font-mono">
                    {p.vercel && <span>vercel: {p.vercel}</span>}
                    <span className={p.tos.includes("URGENT") || p.tos.includes("pending") ? "text-[var(--color-amber)]" : "text-[var(--color-green)]"}>
                      ToS: {p.tos.length > 25 ? p.tos.substring(0, 25) + "…" : p.tos}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="PENDIENTES · TODO" glow="cyan">
          <div className="flex flex-col gap-1.5">
            {items.map((it: any, i: number) => (
              <div key={i} className="flex items-start justify-between gap-2 px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                <div className="flex items-start gap-2">
                  {it.priority === "HIGH" ? (
                    <AlertCircle size={14} className="text-[var(--color-red)] shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 size={14} className="text-[var(--color-text-dim)] shrink-0 mt-0.5" />
                  )}
                  <span className="text-[11px] text-[var(--color-text)]">{it.item}</span>
                </div>
                <span className={`shrink-0 text-[8px] tracking-widest px-2 py-0.5 rounded border font-mono ${PRIORITY_COLOR[it.priority]}`}>
                  {it.priority}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="BANCO" glow="green">
          <div className="flex items-center gap-3 mb-3">
            <Banknote size={24} className="text-[var(--color-green)]" />
            <div>
              <div className="text-sm font-bold text-[var(--color-text)]">{c.banking?.primary || "—"}</div>
              <div className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">{c.banking?.type || "—"}</div>
            </div>
          </div>
          <div className="text-[9px] text-[var(--color-text-dim)] font-mono">
            Página Mercury en Notion = obsoleta (pre-pivot). Banco real = solo BoA.
          </div>
        </Card>

        <Card title="INFRAESTRUCTURA" glow="cyan">
          <div className="space-y-1.5">
            {Object.entries(infra).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between px-2 py-1.5 bg-black/40 rounded border border-[var(--color-border)]">
                <span className="text-[9px] tracking-widest font-mono text-[var(--color-text-dim)]">{k.replace(/_/g, " ").toUpperCase()}</span>
                <span className="text-[10px] font-mono text-[var(--color-text)] truncate ml-2 max-w-[60%]">{String(v)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="HANDLES SOCIALES · RESERVADOS">
          <div className="space-y-1">
            {Object.entries(handles).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-[var(--color-text-dim)]">{k.replace(/_/g, " ")}</span>
                <span className="text-[var(--color-cyan)]">{String(v).toUpperCase()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
