"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, BookOpen, Bell, LogOut, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { RoleBadge } from "@/components/ui/role-badge";
import { api } from "@/lib/api";

const NAV: Record<string, { href: string; label: string; icon: typeof LayoutDashboard }[]> = {
  system_admin: [
    { href: "/admin", label: "Duyệt CSGD", icon: ShieldCheck },
    { href: "/notifications", label: "Thông báo", icon: Bell },
  ],
  institution_admin: [
    { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/materials", label: "Kho học liệu", icon: BookOpen },
    { href: "/notifications", label: "Thông báo", icon: Bell },
  ],
  teacher: [
    { href: "/teacher", label: "Lớp học của tôi", icon: Users },
    { href: "/materials", label: "Kho học liệu", icon: BookOpen },
    { href: "/notifications", label: "Thông báo", icon: Bell },
  ],
  student: [
    { href: "/student", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/materials", label: "Kho học liệu", icon: BookOpen },
    { href: "/notifications", label: "Thông báo", icon: Bell },
  ],
};

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready, clear } = useAuthStore();

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

  const items = NAV[user.role] ?? [];

  async function logout() {
    await api.auth.logout().catch(() => {});
    clear();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-none flex-col border-r border-border bg-surface px-4 py-6">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-white">LMS</div>
          <span className="font-display text-base font-medium text-ink">Nền tảng LMS</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-accent-soft text-accent-strong" : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 font-display text-sm font-medium text-ink">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{user.fullName}</p>
              <RoleBadge role={user.role} />
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
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
