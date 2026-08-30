"use client";

import { use, useState, type FormEvent } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, ClipboardList, Laptop, NotebookPen, Paperclip, Pencil, PlusCircle, Trash2, UserPlus } from "lucide-react";
import { api, ApiError, type AssignmentDto, type SubmissionDto } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";

/** ISO string -> giá trị cho <input type="datetime-local"> theo giờ địa phương. */
function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const statusDot: Record<string, string> = {
  graded: "bg-accent",
  late: "bg-danger",
  submitted: "bg-role-admin",
  not_submitted: "bg-role-student",
};

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
    mutationFn: (status: "draft" | "assigned") =>
      api.assignments.create(classId, { ...form, dueDate: new Date(form.dueDate).toISOString(), status }),
    onSuccess: (_, status) => {
      toast.success(status === "draft" ? "Đã lưu nháp" : "Đã giao bài tập");
      setForm({ title: "", description: "", type: "offline", dueDate: "", maxScore: 10 });
      qc.invalidateQueries({ queryKey: ["assignments", classId] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể tạo bài tập"),
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; description: string; type: "online" | "offline"; dueDate: string; maxScore: number }>({
    title: "",
    description: "",
    type: "offline",
    dueDate: "",
    maxScore: 10,
  });

  function startEdit(a: AssignmentDto) {
    setEditingId(a._id);
    setEditForm({ title: a.title, description: a.description ?? "", type: a.type, dueDate: toDatetimeLocal(a.dueDate), maxScore: a.maxScore });
  }

  const updateAssignment = useMutation({
    mutationFn: () => api.assignments.update(editingId!, { ...editForm, dueDate: new Date(editForm.dueDate).toISOString() }),
    onSuccess: () => {
      toast.success("Đã lưu thay đổi");
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["assignments", classId] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể sửa bài tập"),
  });

  const deleteAssignment = useMutation({
    mutationFn: (assignmentId: string) => api.assignments.remove(assignmentId),
    onSuccess: () => {
      toast.success("Đã xoá bài tập");
      qc.invalidateQueries({ queryKey: ["assignments", classId] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể xoá bài tập"),
  });

  const publishAssignment = useMutation({
    mutationFn: (assignmentId: string) => api.assignments.publish(assignmentId),
    onSuccess: () => {
      toast.success("Đã xuất bản bài tập");
      qc.invalidateQueries({ queryKey: ["assignments", classId] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể xuất bản bài tập"),
  });

  const closeAssignment = useMutation({
    mutationFn: (assignmentId: string) => api.assignments.close(assignmentId),
    onSuccess: () => {
      toast.success("Đã đóng bài tập");
      qc.invalidateQueries({ queryKey: ["assignments", classId] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể đóng bài tập"),
  });

  const [studentForm, setStudentForm] = useState({ email: "", fullName: "" });
  const addStudent = useMutation({
    mutationFn: () => api.classes.addMember(classId, { ...studentForm, role: "student" as const }),
    onSuccess: (res) => {
      // tempPassword chỉ có khi vừa tạo tài khoản mới (chưa có luồng mời qua
      // email) - hiện lâu hơn bình thường để giáo viên kịp copy gửi lại.
      if (res.tempPassword) {
        toast.success(`Đã thêm học sinh. Mật khẩu tạm: ${res.tempPassword}`, {
          description: "Gửi mật khẩu này cho học sinh để họ đăng nhập lần đầu.",
          duration: 20000,
        });
      } else {
        toast.success("Đã thêm học sinh vào lớp");
      }
      setStudentForm({ email: "", fullName: "" });
      qc.invalidateQueries({ queryKey: ["submissions"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể thêm học sinh"),
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">{klass?.name ?? "Lớp học"}</h1>
        <p className="text-sm text-ink-muted">{klass?.subject} · {klass?.academicYear}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thêm học sinh</CardTitle>
        </CardHeader>
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            addStudent.mutate();
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <Field label="Họ tên">
            <Input required value={studentForm.fullName} onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" required value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} />
          </Field>
          <Button type="submit" variant="secondary" loading={addStudent.isPending} className="self-start sm:col-span-2">
            <UserPlus className="h-4 w-4" /> Thêm học sinh
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Giao bài tập mới</CardTitle>
        </CardHeader>
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            createAssignment.mutate("assigned");
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
          <div className="flex gap-2">
            <Button type="submit" variant="secondary" loading={createAssignment.isPending && createAssignment.variables === "assigned"}>
              <PlusCircle className="h-4 w-4" /> Giao bài
            </Button>
            <Button
              type="button"
              variant="ghost"
              loading={createAssignment.isPending && createAssignment.variables === "draft"}
              onClick={(e) => {
                const formEl = e.currentTarget.closest("form");
                if (formEl?.reportValidity()) createAssignment.mutate("draft");
              }}
            >
              Lưu nháp
            </Button>
          </div>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 font-display text-lg font-medium text-ink">Danh sách bài tập</h2>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-2 h-3 w-56" />
              </div>
            ))}
          </div>
        ) : !assignments?.length ? (
          <EmptyState icon={ClipboardList} title="Chưa có bài tập nào" />
        ) : (
          <StaggerGroup className="flex flex-col gap-2">
            {assignments.map((a) => {
              const TypeIcon = a.type === "online" ? Laptop : NotebookPen;
              return (
                <StaggerItem key={a._id} hoverLift className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                  {editingId === a._id ? (
                    <form
                      onSubmit={(e: FormEvent) => {
                        e.preventDefault();
                        updateAssignment.mutate();
                      }}
                      className="flex flex-col gap-3 px-5 py-4"
                    >
                      <Field label="Tiêu đề">
                        <Input required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                      </Field>
                      <Field label="Mô tả">
                        <Textarea rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                      </Field>
                      <div className="grid grid-cols-3 gap-3">
                        <Field label="Hình thức">
                          <Select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value as "online" | "offline" })}>
                            <option value="offline">Offline (chấm tay)</option>
                            <option value="online">Online</option>
                          </Select>
                        </Field>
                        <Field label="Hạn nộp">
                          <Input
                            type="datetime-local"
                            required
                            value={editForm.dueDate}
                            onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                          />
                        </Field>
                        <Field label="Điểm tối đa">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={editForm.maxScore}
                            onChange={(e) => setEditForm({ ...editForm, maxScore: Number(e.target.value) })}
                          />
                        </Field>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" variant="secondary" loading={updateAssignment.isPending}>
                          Lưu
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>
                          Huỷ
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex w-full items-center gap-2 px-5 py-4">
                      <button
                        onClick={() => setExpanded(expanded === a._id ? null : a._id)}
                        className="flex flex-1 items-center gap-4 text-left"
                      >
                        <span
                          className={`flex h-10 w-10 flex-none items-center justify-center rounded-full ${
                            a.type === "online" ? "bg-role-admin-soft text-role-admin" : "bg-role-student-soft text-role-student"
                          }`}
                        >
                          <TypeIcon className="h-5 w-5" strokeWidth={1.75} />
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-display text-base font-medium text-ink">{a.title}</p>
                            {a.status === "draft" && (
                              <span className="rounded-full bg-role-student-soft px-2 py-0.5 text-xs font-medium text-role-student">Nháp</span>
                            )}
                            {a.status === "closed" && (
                              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-muted">Đã đóng</span>
                            )}
                          </div>
                          <p className="text-sm text-ink-muted">
                            {a.type === "online" ? "Online" : "Offline"} · Hạn: {new Date(a.dueDate).toLocaleString("vi-VN")} · Tối đa {a.maxScore} điểm
                          </p>
                        </div>
                      </button>
                      {a.status === "draft" && (
                        <button
                          type="button"
                          onClick={() => publishAssignment.mutate(a._id)}
                          className="rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-surface-2"
                        >
                          Xuất bản
                        </button>
                      )}
                      {a.status === "assigned" && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Đóng bài tập "${a.title}"? Học sinh sẽ không nộp bài mới được nữa.`)) closeAssignment.mutate(a._id);
                          }}
                          className="rounded-md px-2 py-1 text-xs font-medium text-ink-muted hover:bg-surface-2"
                        >
                          Đóng bài
                        </button>
                      )}
                      <button
                        type="button"
                        title="Sửa bài tập"
                        onClick={() => startEdit(a)}
                        className="rounded-md p-2 text-ink-muted hover:bg-surface-2 hover:text-ink"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Xoá bài tập"
                        onClick={() => {
                          if (window.confirm(`Xoá bài tập "${a.title}"?`)) deleteAssignment.mutate(a._id);
                        }}
                        className="rounded-md p-2 text-ink-muted hover:bg-surface-2 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => setExpanded(expanded === a._id ? null : a._id)} className="rounded-md p-2">
                        {expanded === a._id ? <ChevronDown className="h-5 w-5 text-ink-muted" /> : <ChevronRight className="h-5 w-5 text-ink-muted" />}
                      </button>
                    </div>
                  )}
                  {editingId !== a._id && expanded === a._id && <SubmissionsPanel assignmentId={a._id} />}
                </StaggerItem>
              );
            })}
          </StaggerGroup>
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

  // Chấm theo (assignmentId, studentId) thay vì submissionId - dùng chung được
  // cho cả bài online đã có Submission lẫn bài offline chưa từng có bản ghi nào.
  const grade = useMutation({
    mutationFn: ({ studentId, score, feedback }: { studentId: string; score: number; feedback?: string }) =>
      api.submissions.gradeDirect(assignmentId, studentId, { score, feedback }),
    onSuccess: () => {
      toast.success("Đã chấm điểm");
      qc.invalidateQueries({ queryKey: ["submissions", assignmentId] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể chấm điểm"),
  });

  if (isLoading)
    return (
      <div className="flex flex-col gap-2 border-t border-border px-5 py-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  if (!submissions?.length) return <p className="border-t border-border px-5 py-4 text-sm text-ink-muted">Lớp chưa có học sinh nào.</p>;

  return (
    <div className="flex flex-col gap-2 border-t border-border px-5 py-4">
      {submissions.map((s) => (
        <SubmissionRow
          key={s.studentId._id}
          submission={s}
          onGrade={(score, feedback) => grade.mutate({ studentId: s.studentId._id, score, feedback })}
          pending={grade.isPending}
        />
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
    <div className="flex flex-col gap-2 rounded-lg bg-surface-2 px-3 py-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[140px] flex-1">
          <p className="text-sm font-medium text-ink">{submission.studentId.fullName}</p>
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <span className={`h-1.5 w-1.5 rounded-full ${statusDot[submission.status] ?? statusDot.not_submitted}`} />
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
      {submission.textContent && (
        <p className="whitespace-pre-wrap rounded-md bg-surface px-3 py-2 text-sm text-ink">
          <span className="font-medium text-ink-muted">Bài làm: </span>
          {submission.textContent}
        </p>
      )}
      {!!submission.fileUrls?.length && (
        <div className="flex flex-wrap gap-2 rounded-md bg-surface px-3 py-2">
          {submission.fileUrls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-ink hover:border-accent"
            >
              <Paperclip className="h-3.5 w-3.5" />
              {url.split("/").pop()}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
