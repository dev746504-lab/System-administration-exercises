"use client";

import { use, useState, type FormEvent } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, ClipboardList, PlusCircle } from "lucide-react";
import { api, ApiError, type SubmissionDto } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

export default function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const qc = useQueryClient();

  const { data: klass } = useQuery({ queryKey: ["class", classId], queryFn: () => api.classes.get(classId) });
  const { data: assignments, isLoading } = useQuery({ queryKey: ["assignments", classId], queryFn: () => api.assignments.listForClass(classId) });

  const [form, setForm] = useState<{ title: string; description: string; type: "online" | "offline"; dueDate: string; maxScore: number }>({
    title: "",
    description: "",
    type: "offline",
    dueDate: "",
    maxScore: 10,
  });
  const [expanded, setExpanded] = useState<string | null>(null);

  const createAssignment = useMutation({
    mutationFn: () => api.assignments.create(classId, { ...form, dueDate: new Date(form.dueDate).toISOString() }),
    onSuccess: () => {
      toast.success("Đã giao bài tập");
      setForm({ title: "", description: "", type: "offline", dueDate: "", maxScore: 10 });
      qc.invalidateQueries({ queryKey: ["assignments", classId] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể tạo bài tập"),
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">{klass?.name ?? "Lớp học"}</h1>
        <p className="text-sm text-ink-muted">{klass?.subject} · {klass?.academicYear}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Giao bài tập mới</CardTitle>
        </CardHeader>
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            createAssignment.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <Field label="Tiêu đề">
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Bài tập chương 3" />
          </Field>
          <Field label="Mô tả">
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Hình thức">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "online" | "offline" })}>
                <option value="offline">Offline (chấm tay)</option>
                <option value="online">Online</option>
              </Select>
            </Field>
            <Field label="Hạn nộp">
              <Input type="datetime-local" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </Field>
            <Field label="Điểm tối đa">
              <Input type="number" min={0} max={100} required value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })} />
            </Field>
          </div>
          <Button type="submit" variant="secondary" loading={createAssignment.isPending} className="self-start">
            <PlusCircle className="h-4 w-4" /> Giao bài
          </Button>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 font-display text-lg font-medium text-ink">Danh sách bài tập</h2>
        {isLoading ? (
          <p className="text-sm text-ink-muted">Đang tải…</p>
        ) : !assignments?.length ? (
          <EmptyState icon={ClipboardList} title="Chưa có bài tập nào" />
        ) : (
          <div className="flex flex-col gap-2">
            {assignments.map((a) => (
              <div key={a._id} className="rounded-xl border border-border bg-surface">
                <button
                  onClick={() => setExpanded(expanded === a._id ? null : a._id)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <div>
                    <p className="font-display text-base font-medium text-ink">{a.title}</p>
                    <p className="text-sm text-ink-muted">
                      {a.type === "online" ? "Online" : "Offline"} · Hạn: {new Date(a.dueDate).toLocaleString("vi-VN")} · Tối đa {a.maxScore} điểm
                    </p>
                  </div>
                  {expanded === a._id ? <ChevronDown className="h-5 w-5 text-ink-muted" /> : <ChevronRight className="h-5 w-5 text-ink-muted" />}
                </button>
                {expanded === a._id && <SubmissionsPanel assignmentId={a._id} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SubmissionsPanel({ assignmentId }: { assignmentId: string }) {
  const qc = useQueryClient();
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["submissions", assignmentId],
    queryFn: () => api.submissions.listForAssignment(assignmentId),
  });

  const grade = useMutation({
    mutationFn: ({ id, score, feedback }: { id: string; score: number; feedback?: string }) => api.submissions.grade(id, { score, feedback }),
    onSuccess: () => {
      toast.success("Đã chấm điểm");
      qc.invalidateQueries({ queryKey: ["submissions", assignmentId] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể chấm điểm"),
  });

  if (isLoading) return <p className="px-5 pb-4 text-sm text-ink-muted">Đang tải bài nộp…</p>;
  if (!submissions?.length) return <p className="border-t border-border px-5 py-4 text-sm text-ink-muted">Chưa có học sinh nào nộp bài.</p>;

  return (
    <div className="flex flex-col gap-2 border-t border-border px-5 py-4">
      {submissions.map((s) => (
        <SubmissionRow key={s._id} submission={s} onGrade={(score, feedback) => grade.mutate({ id: s._id, score, feedback })} pending={grade.isPending} />
      ))}
    </div>
  );
}

function SubmissionRow({
  submission,
  onGrade,
  pending,
}: {
  submission: SubmissionDto;
  onGrade: (score: number, feedback?: string) => void;
  pending: boolean;
}) {
  const [score, setScore] = useState(submission.score?.toString() ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-2 px-3 py-2">
      <div className="min-w-[140px] flex-1">
        <p className="text-sm font-medium text-ink">{submission.studentId.fullName}</p>
        <p className="text-xs text-ink-muted">
          {submission.status === "graded" ? "Đã chấm" : submission.status === "late" ? "Nộp muộn" : submission.status === "submitted" ? "Đã nộp" : "Chưa nộp"}
        </p>
      </div>
      <Input type="number" min={0} max={100} className="w-20" placeholder="Điểm" value={score} onChange={(e) => setScore(e.target.value)} />
      <Input className="w-56" placeholder="Nhận xét (tuỳ chọn)" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
      <Button
        variant="secondary"
        loading={pending}
        onClick={() => score !== "" && onGrade(Number(score), feedback || undefined)}
        disabled={score === ""}
      >
        Chấm
      </Button>
    </div>
  );
}
