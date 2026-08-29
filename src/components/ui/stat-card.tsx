"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/motion/animated-number";

const styles = {
  accent: { text: "text-accent", soft: "bg-accent-soft" },
  "role-admin": { text: "text-role-admin", soft: "bg-role-admin-soft" },
  "role-teacher": { text: "text-role-teacher", soft: "bg-role-teacher-soft" },
  "role-student": { text: "text-role-student", soft: "bg-role-student-soft" },
} as const;

export function StatCard({
  label,
  value,
  accent = "accent",
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  accent?: keyof typeof styles;
  hint?: string;
  icon?: LucideIcon;
}) {
  const reduce = useReducedMotion();
  const s = styles[accent];

  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
        {Icon && (
          <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-full ${s.soft} ${s.text}`}>
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        )}
      </div>
      <p className={`mt-2 font-display text-3xl font-semibold tabular-nums ${s.text}`}>
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </motion.div>
  );
}
