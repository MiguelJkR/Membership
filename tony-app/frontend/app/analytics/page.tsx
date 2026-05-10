"use client";
import { Card, MiniMetric } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { useEffect, useRef, useState } from "react";
import { api, fmt } from "@/lib/api";
import { TrendingUp, BarChart3, Activity } from "lucide-react";

type ChartInstance = {
  data: { datasets: Array<{ data: number[]; label?: string }> };
  options?: any;
  destroy: () => void;
  update: () => void;
};

declare global {
  interface Window {
    Chart: any;
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<any>({});
  const [perfData, setPerfData] = useState<any>(null);
  const [errorTimeline, setErrorTimeline] = useState<any>(null);

  const equityRef = useRef<HTMLCanvasElement>(null);
  const equityChart = useRef<ChartInstance | null>(null);
  const toolsRef = useRef<HTMLCanvasElement>(null);
  const toolsChart = useRef<ChartInstance | null>(null);
  const errorsRef = useRef<HTMLCanvasElement>(null);
  const errorsChart = useRef<ChartInstance | null>(null);
  const completionRef = useRef<HTMLCanvasElement>(null);
  const completionChart = useRef<ChartInstance | null>(null);

  // Backtest static
  const BACKTEST = {
    total_trades: 77,
    win_rate: 39.0,
    profit_factor: 1.68,
    avg_win: 153.92,
    avg_loss: -58.48,
    rr: 2.63,
    pnl: 1869.21,
    growth_pct: 4.67,
    drawdown: 3.0,
  };

  // Load Chart.js dynamically (avoid hydration issues)
  useEffect(() => {
    if (typeof window !== "undefined" && !window.Chart) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js";
      script.async = true;
      script.onload = () => {
        // Trigger re-render by updating state
        setData((d: any) => ({ ...d, chartReady: true }));
      };
      document.head.appendChild(script);
    } else if (window.Chart) {
      setData((d: any) => ({ ...d, chartReady: true }));
    }
  }, []);

  // Fetch all data sources
  useEffect(() => {
    Promise.all([
      api.portfolio(),
      api.perfHistory(),
      api.agentPerformance(),
      api.n8nErrorTimeline(),
    ]).then(([portfolio, perf, agentPerf, errs]) => {
      setData((d: any) => ({ ...d, portfolio, perf }));
      setPerfData(agentPerf);
      setErrorTimeline(errs);
    });
  }, []);

  // Equity chart
  useEffect(() => {
    if (!data.chartReady || !data.perf?.rows || !equityRef.current || !window.Chart) return;
    if (equityChart.current) equityChart.current.destroy();

    const rows = data.perf.rows.slice(-50);
    const labels = rows.map((r: any) => (r.ts || "").substring(5, 10));
    const realMoney = rows.map((r: any) => r.real_money_value || 0);
    const oanda = rows.map((r: any) => r.oanda_value || 0);

    const ctx = equityRef.current.getContext("2d");
    if (!ctx) return;
    equityChart.current = new window.Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "REAL Moomoo",
            data: realMoney,
            borderColor: "#00e5ff",
            backgroundColor: "rgba(0,229,255,0.08)",
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2,
          },
          {
            label: "DEMO OANDA",
            data: oanda,
            borderColor: "#fbbf24",
            backgroundColor: "rgba(251,191,36,0.06)",
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: { color: "#c0e0ff", font: { family: "Consolas", size: 10 }, usePointStyle: true },
          },
          tooltip: {
            backgroundColor: "rgba(10,21,37,0.95)",
            borderColor: "rgba(0,229,255,0.3)",
            borderWidth: 1,
            titleColor: "#00e5ff",
            bodyColor: "#c0e0ff",
            titleFont: { family: "Consolas" },
            bodyFont: { family: "Consolas" },
          },
        },
        scales: {
          x: {
            ticks: { color: "#6b7d99", font: { family: "Consolas", size: 9 } },
            grid: { color: "rgba(0,229,255,0.05)" },
          },
          y: {
            ticks: { color: "#6b7d99", font: { family: "Consolas", size: 9 }, callback: (v: any) => "$" + v },
            grid: { color: "rgba(0,229,255,0.05)" },
          },
        },
      },
    });
  }, [data.chartReady, data.perf]);

  // Tools usage chart
  useEffect(() => {
    if (!data.chartReady || !perfData?.top_tools || !toolsRef.current || !window.Chart) return;
    if (toolsChart.current) toolsChart.current.destroy();

    const top = perfData.top_tools.slice(0, 10);
    const labels = top.map((t: any) => t[0]);
    const counts = top.map((t: any) => t[1]);

    const ctx = toolsRef.current.getContext("2d");
    if (!ctx) return;
    toolsChart.current = new window.Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          data: counts,
          backgroundColor: "rgba(0,229,255,0.6)",
          borderColor: "#00e5ff",
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: "#6b7d99", font: { family: "Consolas", size: 9 } },
            grid: { color: "rgba(0,229,255,0.05)" },
          },
          y: {
            ticks: { color: "#c0e0ff", font: { family: "Consolas", size: 10 } },
            grid: { display: false },
          },
        },
      },
    });
  }, [data.chartReady, perfData]);

  // Errors histogram
  useEffect(() => {
    if (!data.chartReady || !errorTimeline?.timeline || !errorsRef.current || !window.Chart) return;
    if (errorsChart.current) errorsChart.current.destroy();

    const tl = errorTimeline.timeline;
    const labels = tl.map((b: any) => b.label);
    const counts = tl.map((b: any) => b.count);

    const ctx = errorsRef.current.getContext("2d");
    if (!ctx) return;
    errorsChart.current = new window.Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          data: counts,
          backgroundColor: counts.map((c: number) =>
            c === 0 ? "rgba(74,222,128,0.3)" : c <= 3 ? "rgba(251,191,36,0.7)" : "rgba(239,68,68,0.8)"
          ),
          borderColor: counts.map((c: number) =>
            c === 0 ? "#4ade80" : c <= 3 ? "#fbbf24" : "#ef4444"
          ),
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: "#6b7d99", font: { family: "Consolas", size: 9 }, maxRotation: 45 },
            grid: { display: false },
          },
          y: {
            ticks: { color: "#6b7d99", font: { family: "Consolas", size: 9 } },
            grid: { color: "rgba(0,229,255,0.05)" },
          },
        },
      },
    });
  }, [data.chartReady, errorTimeline]);

  // Completion timeline (donut)
  useEffect(() => {
    if (!data.chartReady || !perfData?.status_breakdown || !completionRef.current || !window.Chart) return;
    if (completionChart.current) completionChart.current.destroy();

    const sb = perfData.status_breakdown;
    const labels = Object.keys(sb);
    const counts = labels.map((l) => sb[l]);
    const colors = labels.map((l) =>
      l === "complete" ? "#4ade80" :
      l === "error" ? "#ef4444" :
      l === "needs_approval" ? "#fbbf24" :
      "#6b7d99"
    );

    const ctx = completionRef.current.getContext("2d");
    if (!ctx) return;
    completionChart.current = new window.Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data: counts,
          backgroundColor: colors,
          borderColor: "#0a1525",
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: {
            position: "right",
            labels: { color: "#c0e0ff", font: { family: "Consolas", size: 10 }, usePointStyle: true },
          },
        },
      },
    });
  }, [data.chartReady, perfData]);

  return (
    <div className="p-5 space-y-4">
      <PageHeader title="Análisis" subtitle="MÉTRICAS PERFORMANCE · BACKTESTING · TONY AGENT TIMELINE" />

      <Card title="PERFORMANCE DE LA CUENTA" glow="green">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <MiniMetric label="TASA ACIERTO" value="—" tone="cyan" />
          <MiniMetric label="FACTOR PROFIT" value="—" tone="cyan" />
          <MiniMetric label="SHARPE" value="—" tone="cyan" />
          <MiniMetric label="DRAWDOWN" value="—" tone="amber" />
          <MiniMetric label="TRADES TOTAL" value="—" />
          <MiniMetric label="EXPECTATIVA" value="—" />
        </div>
        <div className="mt-3 text-[10px] text-[var(--color-text-dim)] font-mono">
          Métricas a nivel cuenta aún sin calcular — requieren bitácora histórica de trades. Pipeline Brain Glia + journal pendiente.
        </div>
      </Card>

      {/* Equity curve chart */}
      <Card title="CURVA DE EQUITY · 50 PUNTOS RECIENTES" glow="cyan">
        <div className="text-[10px] text-[var(--color-text-dim)] font-mono mb-2 flex items-center gap-2">
          <TrendingUp size={11} className="text-[var(--color-cyan)]" />
          Real Moomoo (cyan) vs Demo OANDA (ámbar)
        </div>
        <div className="h-72">
          <canvas ref={equityRef}></canvas>
        </div>
      </Card>

      {/* Tony Agent visualizations grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="TONY AGENT · TOOLS USAGE">
          <div className="text-[10px] text-[var(--color-text-dim)] font-mono mb-2 flex items-center gap-2">
            <BarChart3 size={11} className="text-[var(--color-cyan)]" />
            Top 10 tools más invocadas
          </div>
          <div className="h-72">
            <canvas ref={toolsRef}></canvas>
          </div>
        </Card>

        <Card title="TONY AGENT · STATUS BREAKDOWN">
          <div className="text-[10px] text-[var(--color-text-dim)] font-mono mb-2 flex items-center gap-2">
            <Activity size={11} className="text-[var(--color-cyan)]" />
            Distribución completa / error / approval
          </div>
          <div className="h-72">
            <canvas ref={completionRef}></canvas>
          </div>
        </Card>
      </div>

      <Card title="N8N ERRORS · ÚLTIMAS 24H POR HORA" glow="cyan">
        <div className="text-[10px] text-[var(--color-text-dim)] font-mono mb-2">
          Verde = sin errores · Ámbar = 1-3 · Rojo = 4+
        </div>
        <div className="h-56">
          <canvas ref={errorsRef}></canvas>
        </div>
      </Card>

      <Card title="BACKTEST ML_SUPERTREND_BOT · 60D" glow="cyan">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <MiniMetric label="TRADES" value={`${BACKTEST.total_trades}`} tone="cyan" />
          <MiniMetric label="TASA ACIERTO" value={`${BACKTEST.win_rate}%`} tone="amber" />
          <MiniMetric label="FACTOR PROFIT" value={BACKTEST.profit_factor.toFixed(2)} tone="green" />
          <MiniMetric label="R:R REALIZADO" value={BACKTEST.rr.toFixed(2)} tone="green" />
          <MiniMetric label="G/P TOTAL" value={fmt(BACKTEST.pnl)} tone="green" />
          <MiniMetric label="DD MÁXIMO" value={`${BACKTEST.drawdown}%`} tone="green" />
        </div>
        <div className="mt-3 px-3 py-2 bg-[var(--color-green)]/5 border-l-2 border-[var(--color-green)] rounded">
          <div className="text-[10px] tracking-widest text-[var(--color-green)] font-mono">VEREDICTO · EDGE POSITIVO</div>
          <div className="text-[11px] text-[var(--color-text-dim)] mt-1">
            39% aciertos × R:R 2.63 = expectativa +$24.36/trade. Por par: EUR_USD ⭐ (50% acierto, +$1,155), GBP_USD (44%, +$394), XAU_USD (37.5%, +$324). USD_JPY descartar (-$5).
            <br /><strong className="text-[var(--color-text)]">Plan jueves post-CPI:</strong> deploy demo con filtro MTF relajado + 3 pares (descartar USD_JPY). Live $200-500 si se sostiene.
          </div>
        </div>
      </Card>

      <Card title="HISTORIAL DE EQUITY · TABLA" glow="green">
        <div className="text-[10px] text-[var(--color-text-dim)] font-mono">
          Histórico Moomoo + OANDA virtual. 15 puntos más recientes.
        </div>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="text-[var(--color-text-dim)] tracking-widest">
                <th className="text-left px-2 py-1">FECHA</th>
                <th className="text-right px-2 py-1">REAL ($)</th>
                <th className="text-right px-2 py-1">DEMO ($)</th>
                <th className="text-right px-2 py-1">G/P MOOMOO</th>
                <th className="text-right px-2 py-1">G/P OANDA</th>
              </tr>
            </thead>
            <tbody>
              {(data.perf?.rows || []).slice(-15).reverse().map((r: any, i: number) => (
                <tr key={i} className="border-t border-[var(--color-border)] hover:bg-black/40">
                  <td className="px-2 py-1 text-[var(--color-text-dim)]">{r.ts}</td>
                  <td className="px-2 py-1 text-right text-[var(--color-cyan)]">{fmt(r.real_money_value)}</td>
                  <td className="px-2 py-1 text-right text-[var(--color-amber)]">{fmt(r.oanda_value)}</td>
                  <td className={`px-2 py-1 text-right ${(r.moomoo_pl || 0) >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]"}`}>{fmt(r.moomoo_pl)}</td>
                  <td className={`px-2 py-1 text-right ${(r.oanda_pl || 0) >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]"}`}>{fmt(r.oanda_pl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
