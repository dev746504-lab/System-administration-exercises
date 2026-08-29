"use client";

import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck, Users, School, PlusCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";

export default function AdminPage() {
  const { user } = useAuthStore();
  if (user?.role === "system_admin") return <SystemAdminView />;
  return <InstitutionAdminView institutionId={user?.institutionId ?? ""} />;
}

function SystemAdminView() {
  const qc = useQueryClient();
  const { data: pending, isLoading } = useQuery({ queryKey: ["institutions", "pending"], queryFn: api.institutions.listPending });

  const approve = useMutation({
    mutationFn: (id: string) => api.institutions.approve(id),
    onSuccess: () => {
      toast.success("Đã duyệt CSGD");
      qc.invalidateQueries({ queryKey: ["institutions", "pending"] });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Duyệt cơ sở giáo dục</h1>
        <p className="text-sm text-ink-muted">Các CSGD tự đăng ký đang chờ được kích hoạt trên hệ thống.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-surface p-5">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-20" />
            </div>
          ))}
        </div>
      ) : !pending?.length ? (
        <EmptyState icon={ShieldCheck} title="Không có CSGD nào đang chờ duyệt" description="Danh sách sẽ xuất hiện ở đây khi có CSGD mới tự đăng ký." />
      ) : (
        <StaggerGroup className="flex flex-col gap-3">
          {pending.map((inst) => (
            <StaggerItem key={inst._id}>
              <Card className="flex items-center justify-between">
                <div>
                  <p className="font-display text-base font-medium text-ink">{inst.name}</p>
                  <p className="font-mono text-xs text-ink-muted">{inst.code}</p>
                </div>
                <Button onClick={() => approve.mutate(inst._id)} loading={approve.isPending}>
                  Duyệt
                </Button>
              </Card>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}

function InstitutionAdminView({ institutionId }: { institutionId: string }) {
  const qc = useQueryClient();
  const { data: classes, isLoading: classesLoading } = useQuery({ queryKey: ["classes", institutionId], queryFn: () => api.classes.list(institutionId), enabled: !!institutionId });
  const { data: members, isLoading: membersLoading } = useQuery({ queryKey: ["members", institutionId], queryFn: () => api.institutions.listMembers(institutionId), enabled: !!institutionId });

  const [classForm, setClassForm] = useState({ name: "", subject: "", gradeLevel: "", academicYear: "2026-2027" });
  const [memberForm, setMemberForm] = useState({ email: "", fullName: "", role: "teacher" });

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
    onSuccess: () => {
      toast.success("Đã thêm thành viên");
      setMemberForm({ email: "", fullName: "", role: "teacher" });
      qc.invalidateQueries({ queryKey: ["members", institutionId] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Không thể thêm thành viên"),
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Tổng quan CSGD</h1>
        <p className="text-sm text-ink-muted">Quản lý lớp học, thành viên và theo dõi hoạt động chung.</p>
      </div>

      {classesLoading || membersLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <StaggerGroup className="grid gap-4 sm:grid-cols-2">
          <StaggerItem>
            <StatCard label="Lớp học" value={classes?.length ?? 0} accent="role-admin" hint="đang hoạt động" />
          </StaggerItem>
          <StaggerItem>
            <StatCard label="Thành viên" value={members?.length ?? 0} accent="role-teacher" hint="giáo viên & học sinh" />
          </StaggerItem>
        </StaggerGroup>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lớp học</CardTitle>
          </CardHeader>
          <div className="mb-4 flex flex-col gap-2">
            {classes?.length ? (
              classes.map((c) => (
                <div key={c._id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <span className="font-medium text-ink">{c.name}</span>
                  <span className="text-ink-muted">{c.subject ?? "-"} · {c.academicYear}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-muted">Chưa có lớp học nào.</p>
            )}
          </div>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              createClass.mutate();
            }}
            className="flex flex-col gap-3 border-t border-border pt-4"
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
            <Button type="submit" variant="secondary" loading={createClass.isPending}>
              <PlusCircle className="h-4 w-4" /> Tạo lớp
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thành viên</CardTitle>
          </CardHeader>
          <div className="mb-4 flex flex-col gap-2">
            {members?.length ? (
              members.map((m) => (
                <div key={m._id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <span className="font-medium text-ink">{m.userId.fullName}</span>
                  <span className="text-ink-muted">{m.role === "teacher" ? "Giáo viên" : m.role === "student" ? "Học sinh" : "Quản trị"}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-muted">Chưa có thành viên nào.</p>
            )}
          </div>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              addMember.mutate();
            }}
            className="flex flex-col gap-3 border-t border-border pt-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Họ tên">
                <Input required value={memberForm.fullName} onChange={(e) => setMemberForm({ ...memberForm, fullName: e.target.value })} />
              </Field>
              <Field label="Vai trò">
                <Select value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}>
                  <option value="teacher">Giáo viên</option>
                  <option value="student">Học sinh</option>
                  <option value="institution_admin">Quản trị viên</option>
                </Select>
              </Field>
            </div>
            <Field label="Email">
              <Input type="email" required value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} />
            </Field>
            <Button type="submit" variant="secondary" loading={addMember.isPending}>
              <Users className="h-4 w-4" /> Thêm thành viên
            </Button>
          </form>
        </Card>
      </div>

      {!institutionId && <EmptyState icon={School} title="Chưa có thông tin CSGD" />}
    </div>
  );
}
