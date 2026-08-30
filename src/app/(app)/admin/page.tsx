"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Check, ChevronRight, GraduationCap, UserPlus, Users2, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";

export default function AdminPage() {
  const qc = useQueryClient();
  const { data: teachers, isLoading: teachersLoading } = useQuery({ queryKey: ["admin", "teachers"], queryFn: api.admin.listTeachers });
  const { data: classes, isLoading: classesLoading } = useQuery({ queryKey: ["admin", "classes"], queryFn: api.admin.listAllClasses });
  const { data: pendingMaterials, isLoading: pendingLoading } = useQuery({
    queryKey: ["admin", "materials", "pending"],
    queryFn: api.admin.listPendingMaterials,
  });

  const [teacherForm, setTeacherForm] = useState({ email: "", fullName: "" });
  const createTeacher = useMutation({
    mutationFn: () => api.admin.createTeacher(teacherForm),
    onSuccess: (res) => {
      if (res.tempPassword) {
        toast.success(`Đã thêm giáo viên. Mật khẩu tạm: ${res.tempPassword}`, {
          description: "Gửi mật khẩu này cho giáo viên để họ đăng nhập lần đầu.",
          duration: 20000,
        });
      } else {
        toast.success("Đã thêm giáo viên");
      }
      setTeacherForm({ email: "", fullName: "" });
      qc.invalidateQueries({ queryKey: ["admin", "teachers"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể thêm giáo viên"),
  });

  const moderate = useMutation({
    mutationFn: ({ materialId, approve }: { materialId: string; approve: boolean }) => api.admin.moderateMaterial(materialId, approve),
    onSuccess: () => {
      toast.success("Đã cập nhật học liệu");
      qc.invalidateQueries({ queryKey: ["admin", "materials", "pending"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể cập nhật"),
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Quản trị hệ thống</h1>
        <p className="text-sm text-ink-muted">Quản lý giáo viên, xem toàn bộ lớp học và duyệt học liệu chia sẻ lên hệ thống.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thêm giáo viên</CardTitle>
        </CardHeader>
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            createTeacher.mutate();
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <Field label="Họ tên">
            <Input required value={teacherForm.fullName} onChange={(e) => setTeacherForm({ ...teacherForm, fullName: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" required value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} />
          </Field>
          <Button type="submit" variant="secondary" loading={createTeacher.isPending} className="self-start sm:col-span-2">
            <UserPlus className="h-4 w-4" /> Thêm giáo viên
          </Button>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 font-display text-lg font-medium text-ink">Danh sách giáo viên</h2>
        {teachersLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !teachers?.length ? (
          <EmptyState icon={Users2} title="Chưa có giáo viên nào" />
        ) : (
          <div className="flex flex-col gap-2">
            {teachers.map((t) => (
              <div key={t._id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                <span className="font-medium text-ink">{t.fullName}</span>
                <span className="text-ink-muted">{t.email}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-medium text-ink">Toàn bộ lớp học</h2>
        <p className="mb-3 text-sm text-ink-muted">Bấm vào một lớp để quản lý y hệt giáo viên phụ trách - thêm học sinh, giao bài, chấm điểm.</p>
        {classesLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !classes?.length ? (
          <EmptyState icon={GraduationCap} title="Chưa có lớp học nào" />
        ) : (
          <StaggerGroup className="flex flex-col gap-2">
            {classes.map((c) => {
              const teacher = typeof c.teacherId === "object" ? c.teacherId : null;
              return (
                <StaggerItem key={c._id} hoverLift>
                  <Link
                    href={`/teacher/classes/${c._id}`}
                    className="flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4 shadow-sm transition-all duration-150 hover:border-accent hover:shadow-md active:scale-[0.99]"
                  >
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-role-teacher-soft text-role-teacher">
                      <GraduationCap className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="flex-1">
                      <p className="font-display text-base font-medium text-ink">{c.name}</p>
                      <p className="text-sm text-ink-muted">
                        {c.subject ?? "-"} · {c.academicYear} · GV: {teacher?.fullName ?? "-"}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-ink-muted" />
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-medium text-ink">Học liệu chờ duyệt lên kho chung</h2>
        {pendingLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !pendingMaterials?.length ? (
          <EmptyState icon={BookOpen} title="Không có học liệu nào đang chờ duyệt" />
        ) : (
          <StaggerGroup className="flex flex-col gap-2">
            {pendingMaterials.map((m) => (
              <StaggerItem key={m._id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4 shadow-sm">
                <div>
                  <p className="font-display text-base font-medium text-ink">{m.title}</p>
                  <p className="text-sm text-ink-muted">
                    {m.type} {m.subject && `· ${m.subject}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    loading={moderate.isPending}
                    onClick={() => moderate.mutate({ materialId: m._id, approve: true })}
                    className="text-accent-strong"
                  >
                    <Check className="h-4 w-4" /> Duyệt
                  </Button>
                  <Button
                    variant="ghost"
                    loading={moderate.isPending}
                    onClick={() => moderate.mutate({ materialId: m._id, approve: false })}
                    className="text-danger"
                  >
                    <X className="h-4 w-4" /> Từ chối
                  </Button>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </div>
    </div>
  );
}
