"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, CheckCircle2, ClipboardList } from "lucide-react";
import { api, ApiError, type AssignmentDto, type ClassDto } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { ProgressRing } from "@/components/progress-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/reveal";

export default function StudentPage() {
  const { user } = useAuthStore();
  const { data: classes, isLoading } = useQuery({
    queryKey: ["classes", user?.institutionId, "student"],
    queryFn: () => api.classes.list(user!.institutionId!),
    enabled: !!user?.institutionId,
  });
  const { data: progress } = useQuery({
    queryKey: ["progress", user?.id],
    queryFn: () => api.reports.forStudent(user!.id),
    enabled: !!user?.id,
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Tổng quan học tập</h1>
        <p className="text-sm text-ink-muted">Bài tập cần làm và tiến độ học tập của bạn.</p>
      </div>

      {!!progress?.length && (
        <Reveal className="flex flex-wrap gap-4">
          {progress.map((p) => (
            <ProgressRing
              key={p._id}
              label={p.subject ?? "Môn học"}
              value={p.avgScore}
              sub={`${p.completedCount}/${p.totalCount} bài đã chấm`}
            />
          ))}
        </Reveal>
      )}

      <div>
        <h2 className="mb-3 font-display text-lg font-medium text-ink">Bài tập theo lớp</h2>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-4">
                <Skeleton className="mb-2 h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
            ))}
          </div>
        ) : !classes?.length ? (
          <EmptyState icon={ClipboardList} title="Bạn chưa được xếp vào lớp nào" />
        ) : (
          <div className="flex flex-col gap-5">
            {classes.map((c) => (
              <ClassAssignments key={c._id} klass={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ClassAssignments({ klass }: { klass: ClassDto }) {
  const { data: assignments } = useQuery({ queryKey: ["assignments", klass._id], queryFn: () => api.assignments.listForClass(klass._id) });

  return (
    <div>
      <p className="mb-2 font-display text-base font-medium text-ink">{klass.name}</p>
      {!assignments?.length ? (
        <p className="text-sm text-ink-muted">Chưa có bài tập nào.</p>
      ) : (
        <StaggerGroup className="flex flex-col gap-2">
          {assignments.map((a) => (
            <StaggerItem key={a._id}>
              <AssignmentRow assignment={a} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}

function AssignmentRow({ assignment }: { assignment: AssignmentDto }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const { data: mine } = useQuery({ queryKey: ["my-submission", assignment._id], queryFn: () => api.submissions.findMine(assignment._id) });

  const submit = useMutation({
    mutationFn: () => api.submissions.submit(assignment._id, { textContent: text }),
    onSuccess: () => {
      toast.success("Đã nộp bài");
      qc.invalidateQueries({ queryKey: ["my-submission", assignment._id] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể nộp bài"),
  });

  const submitted = mine && mine.status !== "not_submitted";

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{assignment.title}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
            <CalendarClock className="h-3.5 w-3.5" />
            Hạn: {new Date(assignment.dueDate).toLocaleString("vi-VN")} · Tối đa {assignment.maxScore} điểm
          </p>
        </div>
        {submitted && (
          <span className="flex items-center gap-1 text-xs font-medium text-accent-strong">
            <CheckCircle2 className="h-4 w-4" />
            {mine?.status === "graded" ? `Đã chấm: ${mine.score}/${assignment.maxScore}` : mine?.status === "late" ? "Đã nộp (muộn)" : "Đã nộp"}
          </span>
        )}
      </div>

      {!submitted && assignment.type === "online" && (
        <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
          <Textarea rows={2} placeholder="Nội dung bài làm…" value={text} onChange={(e) => setText(e.target.value)} />
          <Button variant="secondary" className="self-start" loading={submit.isPending} onClick={() => submit.mutate()} disabled={!text.trim()}>
            Nộp bài
          </Button>
        </div>
      )}

      {mine?.feedback && <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink-muted">Nhận xét: {mine.feedback}</p>}
    </div>
  );
}
