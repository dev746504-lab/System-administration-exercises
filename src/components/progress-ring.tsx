"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

export function ProgressRing({ label, value, sub }: { label: string; value: number; sub: string }) {
  const data = [{ name: label, value: Math.round(value * 10) / 10, fill: "var(--accent)" }];
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface p-4">
      <div className="relative flex h-[120px] w-[120px] items-center justify-center">
        <RadialBarChart width={120} height={120} innerRadius="72%" outerRadius="100%" barSize={10} data={data} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 10]} angleAxisId={0} tick={false} />
          <RadialBar background={{ fill: "var(--surface-2)" }} dataKey="value" cornerRadius={6} />
        </RadialBarChart>
        <p className="absolute font-display text-2xl font-semibold tabular-nums text-ink">{value.toFixed(1)}</p>
      </div>
      <p className="text-center text-sm font-medium text-ink">{label}</p>
      <p className="text-xs text-ink-muted">{sub}</p>
    </div>
  );
}
