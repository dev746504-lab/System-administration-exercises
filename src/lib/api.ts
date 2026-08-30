import { useAuthStore, type SessionUser } from "./auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.message ?? `Lỗi ${res.status}`;
  } catch {
    return `Lỗi ${res.status}`;
  }
}

async function rawRequest(path: string, init: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
}

let refreshPromise: Promise<boolean> | null = null;

/** Dùng refresh_token cookie (httpOnly) để lấy access token mới + hồ sơ user; gộp các lần gọi đồng thời làm một. */
async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshRes = await rawRequest("/auth/refresh", { method: "POST" });
      if (!refreshRes.ok) return false;
      const { accessToken } = await refreshRes.json();

      const meRes = await rawRequest("/auth/me", { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!meRes.ok) return false;
      const user: SessionUser = await meRes.json();

      useAuthStore.getState().setSession(accessToken, user);
      return true;
    })()
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await rawRequest(path, {
    ...init,
    headers: { ...(token && { Authorization: `Bearer ${token}` }), ...init.headers },
  });

  if (res.status === 401 && retry) {
    const refreshed = await refreshSession();
    if (refreshed) return request<T>(path, init, false);
    useAuthStore.getState().clear();
  }

  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) });
const patch = <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) });

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}

export interface AddMemberResponse {
  userId: string;
  email: string;
  role: string;
  /** Chỉ có khi vừa tạo tài khoản mới - hiển thị một lần cho người thêm gửi lại. */
  tempPassword?: string;
}

export const api = {
  auth: {
    login: (email: string, password: string) => post<LoginResponse>("/auth/login", { email, password }),
    logout: () => post<{ message: string }>("/auth/logout"),
    /** Gọi một lần khi app khởi động để khôi phục phiên từ refresh cookie, nếu có. */
    bootstrap: () => refreshSession(),
  },
  admin: {
    createTeacher: (dto: { email: string; fullName: string }) => post<AddMemberResponse>("/admin/teachers", dto),
    listTeachers: () => get<TeacherDto[]>("/admin/teachers"),
    listAllClasses: () => get<ClassDto[]>("/admin/classes"),
    listPendingMaterials: () => get<MaterialDto[]>("/admin/materials/pending"),
    moderateMaterial: (materialId: string, approve: boolean) => patch(`/admin/materials/${materialId}/moderate?approve=${approve}`),
  },
  classes: {
    list: () => get<ClassDto[]>("/classes"),
    create: (dto: { name: string; subject?: string; gradeLevel?: string; academicYear: string }) => post<ClassDto>("/classes", dto),
    get: (classId: string) => get<ClassDto>(`/classes/${classId}`),
    listMembers: (classId: string) => get<ClassMemberDto[]>(`/classes/${classId}/members`),
    addMember: (classId: string, dto: { email: string; fullName: string; role: "teacher" | "student" }) =>
      post<AddMemberResponse>(`/classes/${classId}/members`, dto),
  },
  materials: {
    list: () => get<MaterialDto[]>("/materials"),
    create: (dto: Partial<MaterialDto> & { title: string; type: string; fileUrl: string }) => post<MaterialDto>("/materials", dto),
    share: (materialId: string, dto: { visibility: "class" | "system"; classIds?: string[] }) => patch(`/materials/${materialId}/share`, dto),
    recordDownload: (materialId: string) => patch(`/materials/${materialId}/download`),
  },
  assignments: {
    listForClass: (classId: string) => get<AssignmentDto[]>(`/classes/${classId}/assignments`),
    create: (
      classId: string,
      dto: {
        title: string;
        description?: string;
        type: "online" | "offline";
        examId?: string;
        attachedMaterialIds?: string[];
        dueDate: string;
        maxScore: number;
      },
    ) => post<AssignmentDto>(`/classes/${classId}/assignments`, dto),
    get: (assignmentId: string) => get<AssignmentDto>(`/assignments/${assignmentId}`),
  },
  submissions: {
    submit: (assignmentId: string, dto: { textContent?: string; fileUrls?: string[] }) =>
      post(`/assignments/${assignmentId}/submissions`, dto),
    listForAssignment: (assignmentId: string) => get<SubmissionDto[]>(`/assignments/${assignmentId}/submissions`),
    findMine: (assignmentId: string) => get<SubmissionDto | null>(`/assignments/${assignmentId}/my-submission`),
    grade: (submissionId: string, dto: { score: number; feedback?: string }) => patch(`/submissions/${submissionId}/grade`, dto),
    /** Chấm điểm theo (assignmentId, studentId), không cần Submission có sẵn - dùng cho bài offline. */
    gradeDirect: (assignmentId: string, studentId: string, dto: { score: number; feedback?: string }) =>
      patch(`/assignments/${assignmentId}/students/${studentId}/grade`, dto),
  },
  notifications: {
    list: () => get<NotificationDto[]>("/notifications"),
    send: (dto: { scope: string; classId?: string; title: string; content: string; type?: string }) => post("/notifications", dto),
    markRead: (id: string) => patch(`/notifications/${id}/read`),
  },
  reports: {
    forStudent: (studentId: string, classId?: string) =>
      get<ProgressDto[]>(`/students/${studentId}/progress${classId ? `?classId=${classId}` : ""}`),
    forClass: (classId: string) => get<ProgressDto[]>(`/classes/${classId}/progress`),
  },
  questions: {
    search: (subject?: string) => get<QuestionDto[]>(`/questions${subject ? `?subject=${subject}` : ""}`),
    create: (dto: Partial<QuestionDto> & { type: string; content: string }) => post<QuestionDto>("/questions", dto),
  },
};

export interface TeacherDto {
  _id: string;
  email: string;
  fullName: string;
}

export interface ClassDto {
  _id: string;
  name: string;
  subject?: string;
  gradeLevel?: string;
  academicYear: string;
  status: string;
  /** Chỉ có khi đến từ /admin/classes (populate). */
  teacherId?: string | { _id: string; fullName: string; email: string };
}

export interface ClassMemberDto {
  _id: string;
  userId: { _id: string; fullName: string; email: string };
  role: "teacher" | "student";
}

export interface MaterialDto {
  _id: string;
  title: string;
  type: string;
  visibility: "private" | "class" | "system";
  subject?: string;
  gradeLevel?: string;
  tags: string[];
  fileUrl: string;
  moderationStatus: string;
  downloadCount: number;
  createdAt: string;
}

export interface AssignmentDto {
  _id: string;
  title: string;
  description?: string;
  type: "online" | "offline";
  dueDate: string;
  maxScore: number;
  status: string;
}

export interface SubmissionDto {
  /** null = học sinh chưa có bản ghi nộp bài (hàng roster ghép từ danh sách lớp, chưa từng nộp/được chấm). */
  _id: string | null;
  studentId: { _id: string; fullName: string; email: string };
  status: string;
  score?: number;
  feedback?: string;
  submittedAt?: string;
}

export interface NotificationDto {
  _id: string;
  title: string;
  content: string;
  type: string;
  scope: string;
  createdAt: string;
  readBy: { userId: string }[];
}

export interface ProgressDto {
  _id: string;
  classId: string | { _id: string; name: string };
  studentId?: { _id: string; fullName: string };
  subject?: string;
  avgScore: number;
  completedCount: number;
  totalCount: number;
}

export interface QuestionDto {
  _id: string;
  subject?: string;
  topic?: string;
  type: string;
  content: string;
  difficulty: string;
}
