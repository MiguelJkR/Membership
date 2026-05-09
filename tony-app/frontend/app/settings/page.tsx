"use client";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { User, Wallet, Bell, Cpu, Database, Globe } from "lucide-react";

const SECTIONS = [
  {
    icon: User, title: "PERFIL",
    items: [
      { label: "Nombre", value: "Miguel A Balart Batlle" },
      { label: "Email", value: "contact@maclorianxgroup.com" },
      { label: "Ubicación", value: "Cape Coral, FL · USA" },
      { label: "Telegram", value: "8604927061" },
    ]
  },
  {
    icon: Wallet, title: "BROKERS · CONECTADOS",
    items: [
      { label: "Moomoo (real)", value: "OPENAPI 11111 · 4 posiciones" },
      { label: "OANDA (demo)", value: "fxpractice · cuenta 101-001-39012241" },
      { label: "Estado PDT", value: "VERIFICAR en app Moomoo" },
    ]
  },
  {
    icon: Cpu, title: "PROVEEDORES LLM",
    items: [
      { label: "Groq principal", value: "key gsk_5uHJR4...FqMF (rotada 2026-05-08)" },
      { label: "Ollama respaldo", value: "llama3.2:3b · localhost:11434" },
      { label: "Anthropic Claude", value: "credenciales en n8n" },
    ]
  },
  {
    icon: Bell, title: "NOTIFICACIONES",
    items: [
      { label: "Bot Telegram", value: "@MaclorianxBot · webhook OK" },
      { label: "Voz TTS", value: "Español · habilitada" },
      { label: "Auto-clasificación email", value: "100% confiabilidad (Groq+Ollama)" },
    ]
  },
  {
    icon: Database, title: "ALMACENAMIENTO",
    items: [
      { label: "DB n8n", value: "C:/Users/migue/.n8n/database.sqlite (97MB)" },
      { label: "Vector store", value: "chromadb · 74 chunks YouTube + 2 approvals" },
      { label: "Bóveda GitHub", value: "MiguelJkR/claude-agent-vault (privado)" },
    ]
  },
  {
    icon: Globe, title: "INFRAESTRUCTURA",
    items: [
      { label: "n8n", value: ":5678 · 47 flujos activos" },
      { label: "Panel Tony (legado)", value: ":8765 Flask" },
      { label: "Tony AI (nuevo)", value: ":3000 Next.js (esta app)" },
      { label: "Túnel ngrok", value: "tradition-donor-rummage.ngrok-free.dev" },
    ]
  }
];

export default function SettingsPage() {
  return (
    <div className="p-5 space-y-4">
      <PageHeader title="Ajustes" subtitle="CUENTA · INFRAESTRUCTURA · PREFERENCIAS" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title} title={s.title} glow="cyan">
              <Icon size={20} className="text-[var(--color-cyan)] mb-2" strokeWidth={1.5} />
              <div className="flex flex-col gap-1.5">
                {s.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
                    <span className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono">{item.label}</span>
                    <span className="text-[11px] text-[var(--color-text)] font-mono truncate max-w-[60%] text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
