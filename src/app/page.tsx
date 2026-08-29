import Link from "next/link";
import { GraduationCap, BookOpen, ClipboardCheck, BarChart3 } from "lucide-react";

const features = [
  { icon: BookOpen, title: "Kho học liệu số", desc: "Xây dựng, chia sẻ và khai thác học liệu giữa giáo viên, lớp học và toàn cơ sở." },
  { icon: ClipboardCheck, title: "Giao bài & chấm bài", desc: "Giao bài online/offline, tạo đề thi từ ngân hàng câu hỏi, chấm và phản hồi nhanh." },
  { icon: BarChart3, title: "Báo cáo tiến độ", desc: "Theo dõi tiến độ học sinh theo thời gian thực, báo cáo trực quan cho từng vai trò." },
];

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
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
          <Link href="/register" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong">
            Đăng ký CSGD
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-14 py-16">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-accent-strong">CSGD · Giáo viên · Học sinh</p>
          <h1 className="mt-3 text-balance font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            Quản lý dạy và học, gọn trong một nền tảng
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-muted">
            Từ quản lý lớp học, kho học liệu, giao bài — chấm bài, đến báo cáo tiến độ học sinh theo thời gian thực.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/register" className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-strong">
              Đăng ký cơ sở giáo dục
            </Link>
            <Link href="/login" className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-ink hover:bg-surface-2">
              Tôi đã có tài khoản
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border bg-surface p-5">
              <Icon className="h-6 w-6 text-accent" strokeWidth={1.5} />
              <h3 className="mt-3 font-display text-base font-medium text-ink">{title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border py-6 text-xs text-ink-muted">Nền tảng quản lý học tập — CSGD, Giáo viên, Học sinh.</footer>
    </div>
  );
}
