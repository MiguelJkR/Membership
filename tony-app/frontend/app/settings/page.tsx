"use client";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { User, Wallet, Bell, Cpu, Database, Globe } from "lucide-react";

const SECTIONS = [
  {
    icon: User, title: "PROFILE",
    items: [
      { label: "Name", value: "Miguel A Balart Batlle" },
      { label: "Email", value: "contact@maclorianxgroup.com" },
      { label: "Location", value: "Cape Coral, FL · USA" },
      { label: "Telegram", value: "8604927061" },
    ]
  },
  {
    icon: Wallet, title: "BROKERS · CONNECTED",
    items: [
      { label: "Moomoo (real)", value: "OPENAPI 11111 · 4 positions" },
      { label: "OANDA (demo)", value: "fxpractice · acc 101-001-39012241" },
      { label: "PDT status", value: "VERIFY in Moomoo app" },
    ]
  },
  {
    icon: Cpu, title: "LLM PROVIDERS",
    items: [
      { label: "Groq primary", value: "key gsk_5uHJR4...FqMF (rotated 2026-05-08)" },
      { label: "Ollama fallback", value: "llama3.2:3b · localhost:11434" },
      { label: "Anthropic Claude", value: "credentials in n8n" },
    ]
  },
  {
    icon: Bell, title: "NOTIFICATIONS",
    items: [
      { label: "Telegram bot", value: "@MaclorianxBot · webhook OK" },
      { label: "Voice TTS", value: "Spanish · enabled" },
      { label: "Email auto-classify", value: "100% reliability (Groq+Ollama)" },
    ]
  },
  {
    icon: Database, title: "STORAGE",
    items: [
      { label: "n8n DB", value: "C:/Users/migue/.n8n/database.sqlite (97MB)" },
      { label: "Vector store", value: "chromadb · 74 chunks YouTube + 2 approvals" },
      { label: "GitHub vault", value: "MiguelJkR/claude-agent-vault (private)" },
    ]
  },
  {
    icon: Globe, title: "INFRASTRUCTURE",
    items: [
      { label: "n8n", value: ":5678 · 47 active workflows" },
      { label: "Tony Dashboard (legacy)", value: ":8765 Flask" },
      { label: "Tony AI (new)", value: ":3000 Next.js (this app)" },
      { label: "ngrok tunnel", value: "tradition-donor-rummage.ngrok-free.dev" },
    ]
  }
];

export default function SettingsPage() {
  return (
    <div className="p-5 space-y-4">
      <PageHeader title="Settings" subtitle="ACCOUNT · INFRASTRUCTURE · PREFERENCES" />

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
