"use client";

import { useId, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, CheckCircle2, ClipboardList, FileText, Paperclip, UploadCloud, X } from "lucide-react";
import { api, ApiError, type AssignmentDto, type ClassDto } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { ProgressRing } from "@/components/progress-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { MAX_FILES, uploadToCloudinary, validateFile } from "@/lib/upload";

export default function StudentPage() {
  const { user } = useAuthStore();
  const { data: classes, isLoading } = useQuery({ queryKey: ["classes", "student"], queryFn: api.classes.list });
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
            <StaggerItem key={a._id} hoverLift>
              <AssignmentRow assignment={a} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  url?: string;
  error?: string;
}

function AssignmentRow({ assignment }: { assignment: AssignmentDto }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputId = useId();
  const { data: mine } = useQuery({ queryKey: ["my-submission", assignment._id], queryFn: () => api.submissions.findMine(assignment._id) });

  const submit = useMutation({
    mutationFn: () =>
      api.submissions.submit(assignment._id, {
        textContent: text,
        fileUrls: files.filter((f) => f.url).map((f) => f.url!),
      }),
    onSuccess: () => {
      toast.success("Đã nộp bài");
      qc.invalidateQueries({ queryKey: ["my-submission", assignment._id] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể nộp bài"),
  });

  const uploadOne = (uf: UploadingFile) => {
    api.uploads
      .getSignature()
      .then((sig) =>
        uploadToCloudinary(uf.file, sig, (progress) => setFiles((prev) => prev.map((f) => (f.id === uf.id ? { ...f, progress } : f)))),
      )
      .then((url) => setFiles((prev) => prev.map((f) => (f.id === uf.id ? { ...f, url, progress: 100 } : f))))
      .catch(() => setFiles((prev) => prev.map((f) => (f.id === uf.id ? { ...f, error: "Tải lên thất bại" } : f))));
  };

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const incoming = Array.from(list);
    if (files.length + incoming.length > MAX_FILES) {
      toast.error(`Tối đa ${MAX_FILES} file mỗi bài nộp`);
      return;
    }
    for (const file of incoming) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        continue;
      }
      const uf: UploadingFile = { id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`, file, progress: 0 };
      setFiles((prev) => [...prev, uf]);
      uploadOne(uf);
    }
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const submitted = mine && mine.status !== "not_submitted";
  const statusBorder = mine?.status === "graded" ? "border-l-accent" : submitted ? "border-l-role-admin" : "border-l-role-student";
  const completedFiles = files.filter((f) => f.url).length;
  const isUploading = files.some((f) => !f.url && !f.error);
  const canSubmit = (!!text.trim() || completedFiles > 0) && !isUploading;

  const now = Date.now();
  const isPastDue = now > new Date(assignment.dueDate).getTime();
  const lateDeadlinePassed = !!assignment.lateSubmissionDeadline && now > new Date(assignment.lateSubmissionDeadline).getTime();
  const noMoreSubmissions = isPastDue && (!assignment.allowLateSubmission || lateDeadlinePassed);

  return (
    <div className={`rounded-xl border border-l-4 border-border ${statusBorder} bg-surface p-4 shadow-sm transition-shadow hover:shadow-md`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-ink">{assignment.title}</p>
            {assignment.status === "closed" && (
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-muted">Đã đóng</span>
            )}
          </div>
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

      {!submitted && assignment.status === "closed" && (
        <p className="mt-3 border-t border-border pt-3 text-sm text-ink-muted">Bài tập đã đóng, không còn nhận bài nộp.</p>
      )}

      {!submitted && assignment.status !== "closed" && noMoreSubmissions && (
        <p className="mt-3 border-t border-border pt-3 text-sm text-ink-muted">Đã quá hạn nộp muộn, không thể nộp bài nữa.</p>
      )}

      {!submitted && assignment.status !== "closed" && !noMoreSubmissions && assignment.type === "online" && (
        <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
          {isPastDue && (
            <p className="text-xs text-danger">
              Đã quá hạn nộp chính thức — bài nộp bây giờ sẽ tính là nộp muộn
              {assignment.lateSubmissionDeadline && ` (hạn chót: ${new Date(assignment.lateSubmissionDeadline).toLocaleString("vi-VN")})`}.
            </p>
          )}
          <Textarea rows={2} placeholder="Nội dung bài làm…" value={text} onChange={(e) => setText(e.target.value)} />

          <label
            htmlFor={fileInputId}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed px-4 py-4 text-center text-sm transition-colors ${
              dragOver ? "border-accent bg-accent-soft" : "border-border text-ink-muted hover:border-accent"
            }`}
          >
            <UploadCloud className="h-5 w-5" />
            Kéo thả file vào đây, hoặc bấm để chọn
            <span className="text-xs">PDF, Word, ảnh (jpg/png/heic) · tối đa 20MB/file · tối đa {MAX_FILES} file</span>
            <input
              id={fileInputId}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>

          {files.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {files.map((f) => (
                <li key={f.id} className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <FileText className="h-4 w-4 flex-none text-ink-muted" />
                  <span className="min-w-0 flex-1 truncate text-ink">{f.file.name}</span>
                  {f.error ? (
                    <span className="text-xs text-danger">{f.error}</span>
                  ) : f.url ? (
                    <span className="text-xs text-accent-strong">Đã tải lên</span>
                  ) : (
                    <span className="w-16 text-xs text-ink-muted">{f.progress}%</span>
                  )}
                  <button type="button" onClick={() => removeFile(f.id)} className="text-ink-muted hover:text-danger">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Button variant="secondary" className="self-start" loading={submit.isPending} onClick={() => submit.mutate()} disabled={!canSubmit}>
            <Paperclip className="h-4 w-4" /> Nộp bài
          </Button>
        </div>
      )}

      {mine?.feedback && <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink-muted">Nhận xét: {mine.feedback}</p>}
    </div>
  );
}
