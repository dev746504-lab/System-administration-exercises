"use client";

import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Send } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";

const typeLabel: Record<string, string> = { announcement: "Thông báo", assignment: "Bài tập", grade: "Điểm số", system: "Hệ thống" };

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { data: notifications, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: api.notifications.list });
  const canSend = user?.role === "institution_admin" || user?.role === "teacher";
  const { data: classes } = useQuery({
    queryKey: ["classes", user?.institutionId, "notify"],
    queryFn: () => api.classes.list(user!.institutionId!),
    enabled: canSend && !!user?.institutionId,
  });

  const [form, setForm] = useState({ scope: user?.role === "teacher" ? "class" : "institution", title: "", content: "", classId: "" });
  const send = useMutation({
    mutationFn: () => api.notifications.send(form.scope === "class" ? form : { scope: form.scope, title: form.title, content: form.content }),
    onSuccess: () => {
      toast.success("Đã gửi thông báo");
      setForm((f) => ({ ...f, title: "", content: "" }));
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể gửi thông báo"),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.notifications.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Thông báo</h1>
        <p className="text-sm text-ink-muted">Thông báo từ nhà trường và giáo viên.</p>
      </div>

      {canSend && (
        <Card>
          <CardHeader>
            <CardTitle>Gửi thông báo mới</CardTitle>
          </CardHeader>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              send.mutate();
            }}
            className="flex flex-col gap-3"
          >
            <div className="grid grid-cols-[140px_1fr] gap-3">
              <Field label="Phạm vi">
                <Select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}>
                  {user?.role === "institution_admin" && <option value="institution">Toàn CSGD</option>}
                  <option value="class">Theo lớp</option>
                </Select>
              </Field>
              {form.scope === "class" ? (
                <Field label="Lớp">
                  <Select required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
                    <option value="" disabled>
                      Chọn lớp…
                    </option>
                    {classes?.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : (
                <Field label="Tiêu đề">
                  <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </Field>
              )}
            </div>
            {form.scope === "class" && (
              <Field label="Tiêu đề">
                <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
            )}
            <Field label="Nội dung">
              <Textarea rows={3} required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </Field>
            <Button type="submit" variant="secondary" loading={send.isPending} className="self-start">
              <Send className="h-4 w-4" /> Gửi
            </Button>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-surface px-4 py-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="mt-2 h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : !notifications?.length ? (
        <EmptyState icon={Bell} title="Chưa có thông báo nào" />
      ) : (
        <StaggerGroup className="flex flex-col gap-2">
          {notifications.map((n) => {
            const read = n.readBy.some((r) => r.userId === user?.id);
            return (
              <StaggerItem key={n._id}>
                <button
                  onClick={() => !read && markRead.mutate(n._id)}
                  className={`flex w-full flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-all duration-150 active:scale-[0.99] ${
                    read ? "border-border bg-surface" : "border-accent bg-accent-soft"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-semibold text-ink">{n.title}</span>
                    <span className="text-xs text-ink-muted">{typeLabel[n.type] ?? n.type}</span>
                  </div>
                  <p className="text-sm text-ink-muted">{n.content}</p>
                  <span className="text-xs text-ink-muted">{new Date(n.createdAt).toLocaleString("vi-VN")}</span>
                </button>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}
    </div>
  );
}
