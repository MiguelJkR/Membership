"use client";
import { TonyHero } from "@/components/TonyHero";
import { EstadoSistemaCard } from "@/components/EstadoSistemaCard";
import { ResumenGeneralCard } from "@/components/ResumenGeneralCard";
import { RendimientoCard } from "@/components/RendimientoCard";
import { ActividadRecienteCard } from "@/components/ActividadRecienteCard";
import { AgentesActivosCard } from "@/components/AgentesActivosCard";
import { LiveTicker } from "@/components/LiveTicker";

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
      </div>
    </>
  );
}
