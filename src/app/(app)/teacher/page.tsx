"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronRight, GraduationCap, PlusCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";

export default function TeacherPage() {
  const qc = useQueryClient();

  const { data: classes, isLoading: classesLoading } = useQuery({ queryKey: ["classes"], queryFn: api.classes.list });

  const [classForm, setClassForm] = useState({ name: "", subject: "", gradeLevel: "", academicYear: "2026-2027" });

  const createClass = useMutation({
    mutationFn: () => api.classes.create(classForm),
    onSuccess: () => {
      toast.success("Đã tạo lớp học");
      setClassForm({ name: "", subject: "", gradeLevel: "", academicYear: "2026-2027" });
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể tạo lớp"),
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Tổng quan</h1>
        <p className="text-sm text-ink-muted">Quản lý và giảng dạy trong từng lớp bạn phụ trách.</p>
      </div>

      {classesLoading ? (
        <SkeletonCard />
      ) : (
        <StatCard label="Lớp học" value={classes?.length ?? 0} accent="role-teacher" hint="đang hoạt động" icon={GraduationCap} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tạo lớp mới</CardTitle>
        </CardHeader>
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            createClass.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <Field label="Tên lớp">
            <Input required value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} placeholder="Toán 5A" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Môn học">
              <Input value={classForm.subject} onChange={(e) => setClassForm({ ...classForm, subject: e.target.value })} placeholder="Toán" />
            </Field>
            <Field label="Năm học">
              <Input required value={classForm.academicYear} onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })} />
            </Field>
          </div>
          <Button type="submit" variant="secondary" loading={createClass.isPending} className="self-start">
            <PlusCircle className="h-4 w-4" /> Tạo lớp
          </Button>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 font-display text-lg font-medium text-ink">Lớp học</h2>
        {classesLoading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
            ))}
          </div>
        ) : !classes?.length ? (
          <EmptyState icon={GraduationCap} title="Chưa có lớp học nào" description="Tạo lớp học đầu tiên ở form phía trên." />
        ) : (
          <StaggerGroup className="flex flex-col gap-2">
            {classes.map((c) => (
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
                    <p className="text-sm text-ink-muted">{c.subject ?? "-"} · {c.academicYear}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-ink-muted" />
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </div>
    </div>
  );
}
