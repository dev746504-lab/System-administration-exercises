const accentClasses = {
  accent: "text-accent",
  "role-admin": "text-role-admin",
  "role-teacher": "text-role-teacher",
  "role-student": "text-role-student",
} as const;

export function StatCard({
  label,
  value,
  accent = "accent",
  hint,
}: {
  label: string;
  value: string | number;
  accent?: keyof typeof accentClasses;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-2 font-display text-3xl font-semibold tabular-nums ${accentClasses[accent]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
