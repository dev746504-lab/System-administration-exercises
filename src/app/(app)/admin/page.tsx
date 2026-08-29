"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";

export default function AdminPage() {
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
