import { cn } from "@/lib/cn";
import type { Role } from "@/lib/auth-store";

const styles: Record<Role, string> = {
  system_admin: "bg-surface-2 text-ink-muted",
  institution_admin: "bg-role-admin-soft text-role-admin",
  teacher: "bg-role-teacher-soft text-role-teacher",
  student: "bg-role-student-soft text-role-student",
};

const labels: Record<Role, string> = {
  system_admin: "Hệ thống",
  institution_admin: "CSGD",
  teacher: "Giáo viên",
  student: "Học sinh",
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", styles[role], className)}>
      {labels[role]}
    </span>
  );
}
