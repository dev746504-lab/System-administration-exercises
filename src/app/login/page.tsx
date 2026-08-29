"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuthStore, roleHome } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { accessToken, user } = await api.auth.login(email, password);
      setSession(accessToken, user);
      toast.success(`Chào mừng trở lại, ${user.fullName}`);
      router.push(roleHome[user.role]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">Đăng nhập</h1>
          <p className="text-sm text-ink-muted">Dành cho CSGD, giáo viên và học sinh</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@truong.edu.vn" />
          </Field>
          <Field label="Mật khẩu">
            <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button type="submit" loading={loading} className="mt-2 w-full">
            Đăng nhập
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-medium text-accent-strong hover:underline">
            Đăng ký CSGD
          </Link>
        </p>
      </div>
    </div>
  );
}
