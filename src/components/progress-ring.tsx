"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

export function ProgressRing({ label, value, sub }: { label: string; value: number; sub: string }) {
  const reduce = useReducedMotion();
  const gradientId = useId();
  const data = [{ name: label, value: Math.round(value * 10) / 10, fill: `url(#${gradientId})` }];

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={reduce ? undefined : { y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface p-4 shadow-sm"
    >
      <div className="relative flex h-[120px] w-[120px] items-center justify-center">
        <RadialBarChart width={120} height={120} innerRadius="72%" outerRadius="100%" barSize={10} data={data} startAngle={90} endAngle={-270}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--gradient-a)" />
              <stop offset="100%" stopColor="var(--gradient-b)" />
            </linearGradient>
          </defs>
          <PolarAngleAxis type="number" domain={[0, 10]} angleAxisId={0} tick={false} />
          <RadialBar background={{ fill: "var(--surface-2)" }} dataKey="value" cornerRadius={6} isAnimationActive={!reduce} />
        </RadialBarChart>
        <p className="absolute font-display text-2xl font-semibold tabular-nums text-ink">{value.toFixed(1)}</p>
      </div>
      <p className="text-center text-sm font-medium text-ink">{label}</p>
      <p className="text-xs text-ink-muted">{sub}</p>
    </motion.div>
  );
}
