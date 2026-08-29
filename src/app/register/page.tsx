"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { GraduationCap, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

function BackgroundBlob() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
      <div className="animate-blob h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-gradient-a/25 via-gradient-b/15 to-gradient-c/20 blur-[90px]" />
    </div>
  );
}

export default function RegisterPage() {
  const reduce = useReducedMotion();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", institutionName: "", institutionCode: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.auth.registerInstitution(form);
      setDone(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
        <BackgroundBlob />
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
          className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-border bg-surface/80 p-8 text-center shadow-xl shadow-accent/10 backdrop-blur-sm"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
            <CheckCircle2 className="h-8 w-8" strokeWidth={1.5} />
          </span>
          <h1 className="font-display text-xl font-semibold text-ink">Đăng ký thành công</h1>
          <p className="text-sm text-ink-muted">
            Hồ sơ CSGD &quot;{form.institutionName}&quot; đang chờ Quản trị hệ thống duyệt. Bạn sẽ đăng nhập được ngay với vai trò giáo viên phụ trách, nhưng cần chờ duyệt để thêm thành viên.
          </p>
          <Link
            href="/login"
            className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-accent-strong active:scale-[0.98]"
          >
            Đến trang đăng nhập
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <BackgroundBlob />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md rounded-2xl border border-border bg-surface/80 p-8 shadow-xl shadow-accent/10 backdrop-blur-sm"
      >
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gradient-a to-gradient-b text-white shadow-md shadow-accent/30">
            <GraduationCap className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">Đăng ký cơ sở giáo dục</h1>
          <p className="text-sm text-ink-muted">Tạo tài khoản giáo viên phụ trách + hồ sơ CSGD, chờ hệ thống duyệt</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Họ tên giáo viên phụ trách">
            <Input required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
          </Field>
          <Field label="Mật khẩu">
            <Input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Ít nhất 8 ký tự, có hoa/thường/số"
            />
          </Field>
          <Field label="Tên cơ sở giáo dục">
            <Input required value={form.institutionName} onChange={(e) => update("institutionName", e.target.value)} placeholder="Trường THCS Lê Lợi" />
          </Field>
          <Field label="Mã CSGD (dùng trong hệ thống)">
            <Input
              required
              value={form.institutionCode}
              onChange={(e) => update("institutionCode", e.target.value.toLowerCase())}
              placeholder="thcs-le-loi"
              pattern="[a-z0-9-]+"
            />
          </Field>
          <Button type="submit" loading={loading} className="mt-2 w-full">
            Đăng ký
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-medium text-accent-strong hover:underline">
            Đăng nhập
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
