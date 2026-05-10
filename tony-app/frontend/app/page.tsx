"use client";
import { TonyHero } from "@/components/TonyHero";
import { EstadoSistemaCard } from "@/components/EstadoSistemaCard";
import { ResumenGeneralCard } from "@/components/ResumenGeneralCard";
import { RendimientoCard } from "@/components/RendimientoCard";
import { ActividadRecienteCard } from "@/components/ActividadRecienteCard";
import { AgentesActivosCard } from "@/components/AgentesActivosCard";
import { LiveTicker } from "@/components/LiveTicker";
import { LLMProviderWidget } from "@/components/LLMProviderWidget";
import { N8nWorkflowsWidget } from "@/components/N8nWorkflowsWidget";
import { QuickAgentWidget } from "@/components/QuickAgentWidget";
import { ScheduledTasksWidget } from "@/components/ScheduledTasksWidget";
import { MemoriaSemanticaWidget } from "@/components/MemoriaSemanticaWidget";
import { LLMMoodWidget } from "@/components/LLMMoodWidget";
import { MatrixStream } from "@/components/MatrixStream";
import { AgentRoomsWidget } from "@/components/AgentRoomsWidget";

export default function Home() {
  return (
    <>
      {/* Live ticker bar (under TopBar) */}
      <LiveTicker />

      <div className="p-4 md:p-5 space-y-4">
        {/* Row 1: Hero (col-span-2) | Estado Sistema | Resumen General */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <TonyHero />
          </div>
          <div className="lg:col-span-1">
            <EstadoSistemaCard />
          </div>
          <div className="lg:col-span-1">
            <ResumenGeneralCard />
          </div>
        </div>

        {/* Row 2: Rendimiento (col-span-2) | Actividad | Agentes */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <RendimientoCard />
          </div>
          <div className="lg:col-span-1">
            <ActividadRecienteCard />
          </div>
          <div className="lg:col-span-1">
            <AgentesActivosCard />
          </div>
        </div>

        {/* Row 3: Quick Agent (2cols) + LLM Cascade + n8n Workflows */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <QuickAgentWidget />
          </div>
          <div className="lg:col-span-1">
            <LLMProviderWidget />
          </div>
          <div className="lg:col-span-1">
            <N8nWorkflowsWidget />
          </div>
        </div>

        {/* Row 4: Cron Tasks (1) + Memoria (2) + Mood (1) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <ScheduledTasksWidget />
          </div>
          <div className="lg:col-span-2">
            <MemoriaSemanticaWidget n={5} />
          </div>
          <div className="lg:col-span-1">
            <LLMMoodWidget />
          </div>
        </div>

        {/* Row 5: Agent Rooms — specialist crew with linked workflow status */}
        <AgentRoomsWidget />

        {/* Row 6: Matrix Stream — live event ticker (full width) */}
        <div className="rounded-lg border border-[var(--color-green)]/30 bg-[var(--color-bg-card)]/80 backdrop-blur p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] tracking-[0.25em] font-mono text-[var(--color-text)] font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-green)] animate-pulse" />
              MODO MATRIX · LIVE EVENT STREAM
            </h3>
            <span className="text-[8px] tracking-widest font-mono text-[var(--color-text-dim)]">
              EVENTOS REALES · 1.6s DRIP · REFRESH 25s
            </span>
          </div>
          <MatrixStream />
        </div>
      </div>
    </>
  );
}
