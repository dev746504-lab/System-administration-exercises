"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronRight, GraduationCap, PlusCircle, UserPlus, Users2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";

const memberRoleLabel: Record<string, string> = { teacher: "Giáo viên", student: "Học sinh" };

export default function TeacherPage() {
  const { user } = useAuthStore();
  const institutionId = user?.institutionId ?? "";
  const qc = useQueryClient();

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["classes", institutionId],
    queryFn: () => api.classes.list(institutionId),
    enabled: !!institutionId,
  });
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["members", institutionId],
    queryFn: () => api.institutions.listMembers(institutionId),
    enabled: !!institutionId,
  });

  const [classForm, setClassForm] = useState({ name: "", subject: "", gradeLevel: "", academicYear: "2026-2027" });
  const [memberForm, setMemberForm] = useState<{ email: string; fullName: string; role: "teacher" | "student" }>({
    email: "",
    fullName: "",
    role: "student",
  });

  const createClass = useMutation({
    mutationFn: () => api.classes.create(institutionId, classForm),
    onSuccess: () => {
      toast.success("Đã tạo lớp học");
      setClassForm({ name: "", subject: "", gradeLevel: "", academicYear: "2026-2027" });
      qc.invalidateQueries({ queryKey: ["classes", institutionId] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể tạo lớp"),
  });

  const addMember = useMutation({
    mutationFn: () => api.institutions.addMember(institutionId, memberForm),
    onSuccess: (res) => {
      // tempPassword chỉ có khi vừa tạo tài khoản mới (chưa có luồng mời qua
      // email) - hiện lâu hơn bình thường để giáo viên kịp copy gửi lại.
      if (res.tempPassword) {
        toast.success(`Đã thêm thành viên. Mật khẩu tạm: ${res.tempPassword}`, {
          description: "Gửi mật khẩu này cho thành viên để họ đăng nhập lần đầu.",
          duration: 20000,
        });
      } else {
        toast.success("Đã thêm thành viên");
      }
      setMemberForm({ email: "", fullName: "", role: "student" });
      qc.invalidateQueries({ queryKey: ["members", institutionId] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể thêm thành viên"),
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Tổng quan</h1>
        <p className="text-sm text-ink-muted">Quản lý lớp học, thành viên CSGD, và giảng dạy trong từng lớp bạn phụ trách.</p>
      </div>

      {classesLoading || membersLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <StaggerGroup className="grid gap-4 sm:grid-cols-2">
          <StaggerItem>
            <StatCard label="Lớp học" value={classes?.length ?? 0} accent="role-teacher" hint="đang hoạt động" icon={GraduationCap} />
          </StaggerItem>
          <StaggerItem>
            <StatCard label="Thành viên" value={members?.length ?? 0} accent="role-admin" hint="giáo viên & học sinh" icon={Users2} />
          </StaggerItem>
        </StaggerGroup>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
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

        <Card>
          <CardHeader>
            <CardTitle>Thêm thành viên</CardTitle>
          </CardHeader>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              addMember.mutate();
            }}
            className="flex flex-col gap-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Họ tên">
                <Input required value={memberForm.fullName} onChange={(e) => setMemberForm({ ...memberForm, fullName: e.target.value })} />
              </Field>
              <Field label="Vai trò">
                <Select value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value as "teacher" | "student" })}>
                  <option value="student">Học sinh</option>
                  <option value="teacher">Giáo viên</option>
                </Select>
              </Field>
            </div>
            <Field label="Email">
              <Input type="email" required value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} />
            </Field>
            <Button type="submit" variant="secondary" loading={addMember.isPending} className="self-start">
              <UserPlus className="h-4 w-4" /> Thêm thành viên
            </Button>
          </form>
        </Card>
      </div>

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
          <EmptyState icon={Users2} title="Chưa có lớp học nào" description="Tạo lớp học đầu tiên ở form phía trên." />
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

      <div>
        <h2 className="mb-3 font-display text-lg font-medium text-ink">Thành viên CSGD</h2>
        {!members?.length ? (
          <p className="text-sm text-ink-muted">Chưa có thành viên nào.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <div key={m._id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                <span className="font-medium text-ink">{m.userId.fullName}</span>
                <span className="text-ink-muted">{memberRoleLabel[m.role] ?? m.role}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
