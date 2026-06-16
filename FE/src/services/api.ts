import { AuthResponse, CartItem, Course, Enrollment, Payment, User } from '../types';

const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...options,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || res.statusText);
  }
  return data as T;
}

type CreateCourseDto = Omit<Course, 'id' | 'created_at' | 'updated_at'>;
type UpdateCourseDto = Partial<CreateCourseDto>;

interface CoursesResponse {
  data: Course[];
  total: number;
  page: number;
  limit: number;
}

export const authApi = {
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
};

export const courseApi = {
  getAll: (params?: { category?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.page) query.set('page', String(params.page));
    query.set('limit', String(params?.limit ?? 100));
    return request<CoursesResponse>(`/courses?${query}`);
  },
  getById: (id: number) => request<Course>(`/courses/${id}`),
  create: (data: CreateCourseDto) =>
    request<Course>('/courses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateCourseDto) =>
    request<Course>(`/courses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/courses/${id}`, { method: 'DELETE' }),
};

export const userApi = {
  getById: (id: number) => request<User>(`/users/${id}`),
  getEnrollments: (userId: number) =>
    request<Enrollment[]>(`/users/${userId}/enrollments`),
};

export const enrollmentApi = {
  create: (user_id: number, course_id: number) =>
    request<Enrollment>('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ user_id, course_id }),
    }),
  cancel: (id: number) =>
    request<void>(`/enrollments/${id}`, { method: 'DELETE' }),
  getOne: (id: number) => request<Enrollment>(`/enrollments/${id}`),
  updateProgress: (
    id: number,
    data: { progress_percent?: number; last_position_seconds?: number },
  ) =>
    request<Enrollment>(`/enrollments/${id}/progress`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export const cartApi = {
  getCart: () => request<CartItem[]>('/cart'),
  addItem: (course_id: number) =>
    request<CartItem>('/cart', { method: 'POST', body: JSON.stringify({ course_id }) }),
  removeItem: (itemId: number) =>
    request<void>(`/cart/${itemId}`, { method: 'DELETE' }),
  clearCart: () => request<void>('/cart', { method: 'DELETE' }),
};

export interface TossPrepareResponse {
  orderId: string;
  amount: number;
  orderName: string;
}

export const paymentApi = {
  checkout: (course_ids: number[]) =>
    request<Payment>('/payments', { method: 'POST', body: JSON.stringify({ course_ids }) }),
  getHistory: () => request<Payment[]>('/payments'),
  tossPrepare: (course_ids: number[]) =>
    request<TossPrepareResponse>('/payments/toss/prepare', {
      method: 'POST',
      body: JSON.stringify({ course_ids }),
    }),
  tossConfirm: (paymentKey: string, orderId: string, amount: number) =>
    request<Payment>('/payments/toss/confirm', {
      method: 'POST',
      body: JSON.stringify({ paymentKey, orderId, amount }),
    }),
};

export interface CourseEnrollmentStudent {
  enrollment_id: number;
  enrolled_at: string;
  progress_percent: number;
  last_position_seconds: number;
  completed_at: string | null;
  student: { id: number; name: string; email: string } | null;
}

export const courseEnrollmentApi = {
  getStudents: (courseId: number) =>
    request<CourseEnrollmentStudent[]>(`/courses/${courseId}/enrollments`),
};

// ──────────────── Q&A ────────────────
export interface QuestionAuthor {
  id: number;
  name: string;
  role: string;
}

export interface QuestionListItem {
  id: number;
  title: string;
  author: QuestionAuthor | null;
  created_at: string;
  answers_count: number;
  is_answered: boolean;
}

export interface QuestionAnswer {
  id: number;
  body: string;
  created_at: string;
  author: QuestionAuthor | null;
}

export interface QuestionDetail {
  id: number;
  course_id: number;
  title: string;
  body: string;
  created_at: string;
  author: QuestionAuthor | null;
  answers: QuestionAnswer[];
}

export const qnaApi = {
  list: (courseId: number) =>
    request<QuestionListItem[]>(`/courses/${courseId}/questions`),
  create: (courseId: number, body: { title: string; body: string }) =>
    request<{ id: number }>(`/courses/${courseId}/questions`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  detail: (questionId: number) =>
    request<QuestionDetail>(`/questions/${questionId}`),
  deleteQuestion: (questionId: number) =>
    request<void>(`/questions/${questionId}`, { method: 'DELETE' }),
  addAnswer: (questionId: number, body: { body: string }) =>
    request<{ id: number }>(`/questions/${questionId}/answers`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteAnswer: (answerId: number) =>
    request<void>(`/answers/${answerId}`, { method: 'DELETE' }),
};

// ──────────────── Admin ────────────────
export interface AdminStats {
  users: { total: number; student: number; instructor: number; admin: number };
  courses: { total: number };
  enrollments: { total: number; completed: number };
  payments: { total_completed: number; revenue: number };
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface AdminAuditLog {
  id: number;
  actor_id: number | null;
  actor_role: string | null;
  action: string;
  target_type: string | null;
  target_id: number | null;
  detail: string | null;
  created_at: string;
}

export interface AdminPaymentRow {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  order_id: string | null;
  payment_key: string | null;
  method: string | null;
  created_at: string;
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const adminApi = {
  stats: () => request<AdminStats>('/admin/stats'),
  users: (q?: { role?: string; q?: string; page?: number; limit?: number }) => {
    const sp = new URLSearchParams();
    if (q?.role) sp.set('role', q.role);
    if (q?.q) sp.set('q', q.q);
    if (q?.page) sp.set('page', String(q.page));
    if (q?.limit) sp.set('limit', String(q.limit));
    return request<Paginated<AdminUser>>(`/admin/users?${sp.toString()}`);
  },
  updateUserRole: (userId: number, role: 'student' | 'instructor' | 'admin') =>
    request<{ id: number; role: string }>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  payments: (q?: { status?: string; page?: number; limit?: number }) => {
    const sp = new URLSearchParams();
    if (q?.status) sp.set('status', q.status);
    if (q?.page) sp.set('page', String(q.page));
    if (q?.limit) sp.set('limit', String(q.limit));
    return request<Paginated<AdminPaymentRow>>(`/admin/payments?${sp.toString()}`);
  },
  logs: (q?: {
    action?: string;
    actor_id?: number;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => {
    const sp = new URLSearchParams();
    if (q?.action) sp.set('action', q.action);
    if (q?.actor_id != null) sp.set('actor_id', String(q.actor_id));
    if (q?.from) sp.set('from', q.from);
    if (q?.to) sp.set('to', q.to);
    if (q?.page) sp.set('page', String(q.page));
    if (q?.limit) sp.set('limit', String(q.limit));
    return request<Paginated<AdminAuditLog>>(`/admin/logs?${sp.toString()}`);
  },
  logActions: () => request<string[]>('/admin/logs/actions'),
};
