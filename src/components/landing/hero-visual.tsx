"use client";

import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { CheckCircle2, Users2 } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

export function HeroVisual() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 20 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div className="relative mx-auto w-full max-w-sm" style={{ perspective: 1000 }}>
      <div className="pointer-events-none absolute -inset-10 -z-10">
        <div className="animate-blob absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-gradient-to-br from-gradient-a/30 via-gradient-b/20 to-gradient-c/25 blur-3xl" />
      </div>

      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={reduce ? undefined : ({ rotateX, rotateY, transformStyle: "preserve-3d" } as Record<string, MotionValue | string>)}
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="rounded-2xl border border-border bg-surface p-5 shadow-lg shadow-accent/10"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-base font-medium text-ink">Toán 5A</p>
            <p className="text-xs text-ink-muted">Học kỳ 2 · 32 học sinh</p>
          </div>
          <span className="rounded-full bg-role-teacher-soft px-2.5 py-1 text-xs font-semibold text-role-teacher">
            Giáo viên
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-2 p-3">
            <p className="text-xs text-ink-muted">Điểm trung bình</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-accent-strong">8.4</p>
          </div>
          <div className="rounded-xl bg-surface-2 p-3">
            <p className="text-xs text-ink-muted">Bài đã chấm</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-role-admin">27/32</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Tiến độ chấm bài</span>
            <span className="tabular-nums">84%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-gradient-a via-gradient-a to-gradient-b"
              initial={reduce ? { width: "84%" } : { width: 0 }}
              animate={{ width: "84%" }}
              transition={{ duration: 1, delay: 0.4, ease: EASE }}
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, x: -16, y: 10 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0, y: [10, 0, -4, 0] }}
        transition={
          reduce
            ? { duration: 0.4 }
            : { opacity: { duration: 0.5, delay: 0.6 }, x: { duration: 0.5, delay: 0.6, ease: EASE }, y: { duration: 4, delay: 1.1, repeat: Infinity, ease: "easeInOut" } }
        }
        className="absolute -bottom-6 -left-8 flex w-56 items-start gap-2.5 rounded-xl border border-border bg-surface p-3 shadow-md"
      >
        <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent-soft text-accent-strong">
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <div>
          <p className="text-xs font-medium text-ink">Đã chấm bài tập 4</p>
          <p className="text-xs text-ink-muted">Nguyễn Văn A · 9/10 điểm</p>
        </div>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.8, ease: EASE }}
        className="absolute -right-4 -top-5 flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink shadow-sm"
      >
        <Users2 className="h-3.5 w-3.5 text-role-admin" strokeWidth={2} />
        3 lớp đang hoạt động
      </motion.div>
    </div>
  );
}
