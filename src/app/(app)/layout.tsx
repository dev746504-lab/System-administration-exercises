"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LayoutDashboard, BookOpen, Bell, LogOut, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { RoleBadge } from "@/components/ui/role-badge";
import { api } from "@/lib/api";

const NAV: Record<string, { href: string; label: string; icon: typeof LayoutDashboard }[]> = {
  teacher: [
    { href: "/teacher", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/materials", label: "Kho học liệu", icon: BookOpen },
    { href: "/notifications", label: "Thông báo", icon: Bell },
  ],
  student: [
    { href: "/student", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/materials", label: "Kho học liệu", icon: BookOpen },
    { href: "/notifications", label: "Thông báo", icon: Bell },
  ],
};

const ADMIN_NAV_ITEM = { href: "/admin", label: "Quản lý giáo viên", icon: ShieldCheck };

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready, clear } = useAuthStore();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const items = user.isAdmin ? [...(NAV[user.role] ?? []), ADMIN_NAV_ITEM] : (NAV[user.role] ?? []);

  async function logout() {
    await api.auth.logout().catch(() => {});
    clear();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-none flex-col border-r border-border bg-surface px-4 py-6">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gradient-a to-gradient-b text-sm font-semibold text-white shadow-sm shadow-accent/30">
            LMS
          </div>
          <span className="font-display text-base font-medium text-ink">Nền tảng LMS</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "text-accent-strong" : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-accent-soft"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className="relative h-4 w-4 transition-transform duration-150 group-hover:scale-110" strokeWidth={1.75} />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gradient-a to-gradient-b font-display text-sm font-medium text-white">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{user.fullName}</p>
              <div className="flex items-center gap-1">
                <RoleBadge role={user.role} />
                {user.isAdmin && (
                  <span className="inline-flex items-center rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-2 hover:text-danger"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden px-8 py-8">
        <div className="mx-auto max-w-5xl">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
