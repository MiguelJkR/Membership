"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

export function PortfolioSparkline({
  rows,
  series = "combined",
}: {
  rows?: Array<{ ts: string; combined_value: number; moomoo_pl: number; oanda_pl: number }>;
  series?: "combined" | "moomoo" | "oanda";
}) {
  if (!rows || rows.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-[var(--color-text-dim)] text-xs font-mono">
        Cargando histórico...
      </div>
    );
  }

  const labels = rows.map((r) => r.ts.substr(5, 11));
  const data =
    series === "combined" ? rows.map((r) => r.combined_value) :
    series === "moomoo" ? rows.map((r) => r.moomoo_pl) :
    rows.map((r) => r.oanda_pl);

  return (
    <div className="h-40 w-full">
      <Line
        data={{
          labels,
          datasets: [
            {
              data,
              borderColor: "#00ff88",
              backgroundColor: "rgba(0,255,136,0.1)",
              tension: 0.4,
              fill: true,
              pointRadius: 0,
              borderWidth: 2,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: true } },
          scales: { x: { display: false }, y: { display: false } },
        }}
      />
    </div>
  );
}
