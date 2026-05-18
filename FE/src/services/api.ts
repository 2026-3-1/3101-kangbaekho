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
};

export const cartApi = {
  getCart: () => request<CartItem[]>('/cart'),
  addItem: (course_id: number) =>
    request<CartItem>('/cart', { method: 'POST', body: JSON.stringify({ course_id }) }),
  removeItem: (itemId: number) =>
    request<void>(`/cart/${itemId}`, { method: 'DELETE' }),
  clearCart: () => request<void>('/cart', { method: 'DELETE' }),
};

export const paymentApi = {
  checkout: (course_ids: number[]) =>
    request<Payment>('/payments', { method: 'POST', body: JSON.stringify({ course_ids }) }),
  getHistory: () => request<Payment[]>('/payments'),
};

export interface CourseEnrollmentStudent {
  enrollment_id: number;
  enrolled_at: string;
  student: { id: number; name: string; email: string } | null;
}

export const courseEnrollmentApi = {
  getStudents: (courseId: number) =>
    request<CourseEnrollmentStudent[]>(`/courses/${courseId}/enrollments`),
};
