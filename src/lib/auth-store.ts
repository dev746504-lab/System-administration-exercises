import { create } from "zustand";

export type Role = "system_admin" | "teacher" | "student";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  institutionId: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: SessionUser | null;
  /** true once the initial silent-refresh attempt (on app load) has settled. */
  ready: boolean;
  setSession: (accessToken: string, user: SessionUser) => void;
  setReady: () => void;
  clear: () => void;
}

/**
 * Access token lives in memory only (never localStorage) — on a hard reload
 * it is re-established by a silent call to POST /auth/refresh, which reads
 * the httpOnly refresh cookie the backend set. See lib/api.ts `bootstrapSession`.
 */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  ready: false,
  setSession: (accessToken, user) => set({ accessToken, user }),
  setReady: () => set({ ready: true }),
  clear: () => set({ accessToken: null, user: null }),
}));

export const roleLabel: Record<Role, string> = {
  system_admin: "Quản trị hệ thống",
  teacher: "Giáo viên",
  student: "Học sinh",
};

export const roleHome: Record<Role, string> = {
  system_admin: "/admin",
  teacher: "/teacher",
  student: "/student",
};
