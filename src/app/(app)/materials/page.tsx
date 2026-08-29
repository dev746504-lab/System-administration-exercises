"use client";

import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Download, PlusCircle, Share2 } from "lucide-react";
import { api, ApiError, type MaterialDto } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";

const visibilityLabel: Record<string, string> = { private: "Cá nhân", class: "Chia sẻ lớp", institution: "Toàn CSGD" };
const typeLabel: Record<string, string> = { video: "Video", document: "Tài liệu", image: "Hình ảnh", audio: "Âm thanh", interactive: "Tương tác" };

export default function MaterialsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const canUpload = user?.role === "teacher" || user?.role === "institution_admin";

  const { data: materials, isLoading } = useQuery({
    queryKey: ["materials", user?.institutionId],
    queryFn: () => api.materials.list(user!.institutionId!),
    enabled: !!user?.institutionId,
  });

  const [form, setForm] = useState({ title: "", type: "document", fileUrl: "", subject: "" });
  const create = useMutation({
    mutationFn: () => api.materials.create(user!.institutionId!, form),
    onSuccess: () => {
      toast.success("Đã thêm học liệu");
      setForm({ title: "", type: "document", fileUrl: "", subject: "" });
      qc.invalidateQueries({ queryKey: ["materials", user?.institutionId] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể thêm học liệu"),
  });

  const share = useMutation({
    mutationFn: (materialId: string) => api.materials.share(user!.institutionId!, materialId, { visibility: "institution" }),
    onSuccess: () => {
      toast.success("Đã gửi yêu cầu chia sẻ lên kho chung, chờ CSGD duyệt");
      qc.invalidateQueries({ queryKey: ["materials", user?.institutionId] });
    },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Kho học liệu số</h1>
        <p className="text-sm text-ink-muted">Học liệu cá nhân, học liệu chia sẻ theo lớp và kho chung của CSGD.</p>
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
        <p className="text-sm text-ink-muted">Đang tải…</p>
      ) : !materials?.length ? (
        <EmptyState icon={BookOpen} title="Chưa có học liệu nào" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {materials.map((m) => (
            <MaterialCard key={m._id} material={m} canShare={canUpload} onShare={() => share.mutate(m._id)} sharing={share.isPending} institutionId={user!.institutionId!} />
          ))}
        </div>
      )}
    </div>
  );
}

function MaterialCard({
  material,
  canShare,
  onShare,
  sharing,
  institutionId,
}: {
  material: MaterialDto;
  canShare: boolean;
  onShare: () => void;
  sharing: boolean;
  institutionId: string;
}) {
  const recordDownload = useMutation({ mutationFn: () => api.materials.recordDownload(institutionId, material._id) });
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-base font-medium text-ink">{material.title}</p>
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
            <Share2 className="h-3.5 w-3.5" /> Chia sẻ lên CSGD
          </Button>
        )}
      </div>
    </div>
  );
}
