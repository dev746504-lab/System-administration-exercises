import Link from "next/link";
import { GraduationCap, BookOpen, ClipboardCheck, BarChart3 } from "lucide-react";
import { HeroVisual } from "@/components/landing/hero-visual";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/reveal";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6">
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold">Nền tảng LMS</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-ink hover:text-accent-strong">
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-accent-strong active:scale-[0.98]"
          >
            Đăng ký cơ sở giáo dục
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col gap-24 py-10 lg:py-16">
        <section className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="max-w-xl">
            <p className="font-mono text-xs uppercase tracking-widest text-accent-strong">
              Dành cho CSGD, giáo viên và học sinh
            </p>
            <h1 className="mt-3 text-balance font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              Quản lý dạy và học, gọn trong một nền tảng
            </h1>
            <p className="mt-4 max-w-lg text-lg text-ink-muted">
              Quản lý lớp học, học liệu, bài tập và tiến độ học sinh - tất cả trong một nền tảng duy nhất.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-accent-strong active:scale-[0.98]"
              >
                Đăng ký cơ sở giáo dục
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-ink transition-all duration-150 hover:bg-surface-2 active:scale-[0.98]"
              >
                Đăng nhập
              </Link>
            </div>
          </div>

          <HeroVisual />
        </section>

        <Reveal>
          <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-border bg-accent-soft p-7">
              <BookOpen className="h-7 w-7 text-accent-strong" strokeWidth={1.5} />
              <h3 className="mt-4 font-display text-xl font-medium text-ink">Kho học liệu số</h3>
              <p className="mt-2 max-w-sm text-sm text-ink-muted">
                Xây dựng học liệu cá nhân, chia sẻ theo lớp hoặc đưa lên kho chung để cả cơ sở cùng khai thác.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-accent/30 bg-surface p-6">
                <ClipboardCheck className="h-6 w-6 text-accent" strokeWidth={1.5} />
                <h3 className="mt-3 font-display text-base font-medium text-ink">Giao bài, chấm bài</h3>
                <p className="mt-1.5 text-sm text-ink-muted">
                  Giao bài online hoặc offline, tạo đề từ ngân hàng câu hỏi, phản hồi nhanh cho học sinh.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-6">
                <BarChart3 className="h-6 w-6 text-accent" strokeWidth={1.5} />
                <h3 className="mt-3 font-display text-base font-medium text-ink">Báo cáo tiến độ</h3>
                <p className="mt-1.5 text-sm text-ink-muted">
                  Theo dõi tiến độ theo thời gian thực, trực quan hoá riêng cho từng vai trò.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <StaggerGroup className="grid gap-8 sm:grid-cols-3">
          {[
            { role: "CSGD", border: "border-role-admin", text: "Quản lý toàn bộ cơ sở: lớp học, thành viên, phân quyền, học liệu chung." },
            { role: "Giáo viên", border: "border-role-teacher", text: "Chủ động lớp học của mình: giao bài, chấm bài, chia sẻ học liệu." },
            { role: "Học sinh", border: "border-role-student", text: "Xem bài tập, nộp bài và theo dõi tiến trình học tập của chính mình." },
          ].map(({ role, border, text }) => (
            <StaggerItem key={role} className={`border-t-2 ${border} pt-4`}>
              <p className="font-display text-lg font-medium text-ink">{role}</p>
              <p className="mt-2 text-sm text-ink-muted">{text}</p>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </main>

      <footer className="border-t border-border py-6 text-xs text-ink-muted">
        Nền tảng quản lý học tập cho CSGD, giáo viên và học sinh.
      </footer>
    </div>
  );
}
