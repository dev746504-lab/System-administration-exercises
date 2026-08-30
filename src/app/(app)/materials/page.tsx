"use client";

import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Download, FileText, ImageIcon, Music, PlusCircle, PuzzleIcon, Share2, Video } from "lucide-react";
import { api, ApiError, type MaterialDto } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";

const visibilityLabel: Record<string, string> = { private: "Cá nhân", class: "Chia sẻ lớp", system: "Toàn hệ thống" };
const typeLabel: Record<string, string> = { video: "Video", document: "Tài liệu", image: "Hình ảnh", audio: "Âm thanh", interactive: "Tương tác" };
const typeChip: Record<string, { icon: typeof FileText; soft: string; text: string }> = {
  document: { icon: FileText, soft: "bg-accent-soft", text: "text-accent-strong" },
  video: { icon: Video, soft: "bg-role-admin-soft", text: "text-role-admin" },
  image: { icon: ImageIcon, soft: "bg-role-student-soft", text: "text-role-student" },
  audio: { icon: Music, soft: "bg-accent-soft", text: "text-accent-strong" },
  interactive: { icon: PuzzleIcon, soft: "bg-role-admin-soft", text: "text-role-admin" },
};

export default function MaterialsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const canUpload = user?.role === "teacher";

  const { data: materials, isLoading } = useQuery({ queryKey: ["materials"], queryFn: api.materials.list });

  const [form, setForm] = useState({ title: "", type: "document", fileUrl: "", subject: "" });
  const create = useMutation({
    mutationFn: () => api.materials.create(form),
    onSuccess: () => {
      toast.success("Đã thêm học liệu");
      setForm({ title: "", type: "document", fileUrl: "", subject: "" });
      qc.invalidateQueries({ queryKey: ["materials"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể thêm học liệu"),
  });

  const share = useMutation({
    mutationFn: (materialId: string) => api.materials.share(materialId, { visibility: "system" }),
    onSuccess: () => {
      toast.success("Đã gửi yêu cầu chia sẻ lên kho chung, chờ quản trị viên duyệt");
      qc.invalidateQueries({ queryKey: ["materials"] });
    },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Kho học liệu số</h1>
        <p className="text-sm text-ink-muted">Học liệu cá nhân, học liệu chia sẻ theo lớp và kho chung của hệ thống.</p>
      </div>

      {canUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Thêm học liệu</CardTitle>
          </CardHeader>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              create.mutate();
            }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <Field label="Tiêu đề">
              <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Loại">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(typeLabel).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Môn học">
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Ngữ văn" />
            </Field>
            <Field label="Đường dẫn tệp (URL)">
              <Input required type="url" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://…" />
            </Field>
            <Button type="submit" variant="secondary" loading={create.isPending} className="self-start sm:col-span-2">
              <PlusCircle className="h-4 w-4" /> Thêm vào học liệu cá nhân
            </Button>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="mt-1 h-3 w-20" />
            </div>
          ))}
        </div>
      ) : !materials?.length ? (
        <EmptyState icon={BookOpen} title="Chưa có học liệu nào" />
      ) : (
        <StaggerGroup className="grid gap-3 sm:grid-cols-2">
          {materials.map((m) => (
            <StaggerItem key={m._id} hoverLift>
              <MaterialCard material={m} canShare={canUpload} onShare={() => share.mutate(m._id)} sharing={share.isPending} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}

function MaterialCard({
  material,
  canShare,
  onShare,
  sharing,
}: {
  material: MaterialDto;
  canShare: boolean;
  onShare: () => void;
  sharing: boolean;
}) {
  const recordDownload = useMutation({ mutationFn: () => api.materials.recordDownload(material._id) });
  const chip = typeChip[material.type] ?? typeChip.document;
  const ChipIcon = chip.icon;
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-full ${chip.soft} ${chip.text}`}>
            <ChipIcon className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <p className="font-display text-base font-medium text-ink">{material.title}</p>
        </div>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-muted">{visibilityLabel[material.visibility]}</span>
      </div>
      <p className="text-xs text-ink-muted">
        {typeLabel[material.type] ?? material.type} {material.subject && `· ${material.subject}`}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <a
          href={material.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => recordDownload.mutate()}
          className="flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline"
        >
          <Download className="h-4 w-4" /> Tải/Xem
        </a>
        {canShare && material.visibility === "private" && (
          <Button variant="ghost" onClick={onShare} loading={sharing} className="ml-auto text-xs">
            <Share2 className="h-3.5 w-3.5" /> Chia sẻ lên hệ thống
          </Button>
        )}
      </div>
    </div>
  );
}
