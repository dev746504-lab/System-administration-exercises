"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users2, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { EmptyState } from "@/components/ui/empty-state";

export default function TeacherPage() {
  const { user } = useAuthStore();
  const { data: classes, isLoading } = useQuery({
    queryKey: ["classes", user?.institutionId, "teacher"],
    queryFn: () => api.classes.list(user!.institutionId!),
    enabled: !!user?.institutionId,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Lớp học của tôi</h1>
        <p className="text-sm text-ink-muted">Giao bài, chấm bài và theo dõi tiến độ từng lớp bạn phụ trách.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-muted">Đang tải…</p>
      ) : !classes?.length ? (
        <EmptyState icon={Users2} title="Bạn chưa được xếp vào lớp nào" description="Liên hệ CSGD để được thêm vào lớp học phụ trách." />
      ) : (
        <div className="flex flex-col gap-2">
          {classes.map((c) => (
            <Link
              key={c._id}
              href={`/teacher/classes/${c._id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4 transition-colors hover:border-accent"
            >
              <div>
                <p className="font-display text-base font-medium text-ink">{c.name}</p>
                <p className="text-sm text-ink-muted">{c.subject ?? "—"} · {c.academicYear}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-ink-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
