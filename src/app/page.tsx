import Link from "next/link";
import { GraduationCap, BookOpen, ClipboardCheck, BarChart3, UserRound } from "lucide-react";
import { HeroVisual } from "@/components/landing/hero-visual";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";

const roleAccent = {
  "role-teacher": { border: "border-role-teacher", soft: "bg-role-teacher-soft", text: "text-role-teacher" },
  "role-student": { border: "border-role-student", soft: "bg-role-student-soft", text: "text-role-student" },
} as const;

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center">
        <div className="animate-blob h-[32rem] w-[60rem] rounded-full bg-gradient-to-br from-gradient-a/25 via-gradient-b/15 to-gradient-c/20 blur-[100px]" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6">
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gradient-a to-gradient-b text-white shadow-sm shadow-accent/30">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-semibold">Nền tảng LMS</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-accent-strong active:scale-[0.98]"
            >
              Đăng nhập
            </Link>
          </nav>
        </header>

        <main className="flex flex-1 flex-col gap-24 py-10 lg:py-16">
          <section className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="max-w-xl">
              <p className="font-mono text-xs uppercase tracking-widest text-accent-strong">
                Dành cho giáo viên và học sinh
              </p>
              <h1 className="mt-3 text-balance font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
                Quản lý dạy và học, gọn trong <span className="text-gradient-brand">một nền tảng</span>
              </h1>
              <p className="mt-4 max-w-lg text-lg text-ink-muted">
                Quản lý lớp học, học liệu, bài tập và tiến độ học sinh - tất cả trong một nền tảng duy nhất.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-accent-strong active:scale-[0.98]"
                >
                  Đăng nhập
                </Link>
              </div>
            </div>

            <HeroVisual />
          </section>

          <StaggerGroup className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <StaggerItem hoverLift className="rounded-2xl border border-border bg-accent-soft p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-sm shadow-accent/30">
                <BookOpen className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 font-display text-xl font-medium text-ink">Kho học liệu số</h3>
              <p className="mt-2 max-w-sm text-sm text-ink-muted">
                Xây dựng học liệu cá nhân, chia sẻ theo lớp hoặc đưa lên kho chung để cả hệ thống cùng khai thác.
              </p>
            </StaggerItem>

            <div className="grid gap-4">
              <StaggerItem hoverLift className="rounded-2xl border border-role-admin/30 bg-surface p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-role-admin-soft text-role-admin">
                  <ClipboardCheck className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-3 font-display text-base font-medium text-ink">Giao bài, chấm bài</h3>
                <p className="mt-1.5 text-sm text-ink-muted">
                  Giao bài online hoặc offline, tạo đề từ ngân hàng câu hỏi, phản hồi nhanh cho học sinh.
                </p>
              </StaggerItem>
              <StaggerItem hoverLift className="rounded-2xl border border-role-student/30 bg-surface p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-role-student-soft text-role-student">
                  <BarChart3 className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-3 font-display text-base font-medium text-ink">Báo cáo tiến độ</h3>
                <p className="mt-1.5 text-sm text-ink-muted">
                  Theo dõi tiến độ theo thời gian thực, trực quan hoá riêng cho từng vai trò.
                </p>
              </StaggerItem>
            </div>
          </StaggerGroup>

          <StaggerGroup className="grid gap-8 sm:grid-cols-2">
            {[
              {
                role: "Giáo viên",
                icon: GraduationCap,
                accent: "role-teacher" as const,
                text: "Tạo và quản lý lớp học của mình: thêm học sinh, kho học liệu, thông báo - cùng với giao bài, chấm bài hằng ngày.",
              },
              {
                role: "Học sinh",
                icon: UserRound,
                accent: "role-student" as const,
                text: "Xem bài tập, nộp bài và theo dõi tiến trình học tập của chính mình.",
              },
            ].map(({ role, icon: Icon, accent, text }) => {
              const a = roleAccent[accent];
              return (
                <StaggerItem key={role} hoverLift className={`rounded-2xl border-t-2 ${a.border} bg-surface p-6 shadow-sm`}>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full ${a.soft} ${a.text}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <p className="mt-3 font-display text-lg font-medium text-ink">{role}</p>
                  <p className="mt-2 text-sm text-ink-muted">{text}</p>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </main>

        <footer className="border-t border-border py-6 text-xs text-ink-muted">
          Nền tảng quản lý học tập cho giáo viên và học sinh.
        </footer>
      </div>
    </div>
  );
}
