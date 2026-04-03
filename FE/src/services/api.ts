import { Course, User, Enrollment } from '../types';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
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
  create: (data: { name: string; email: string; role?: string }) =>
    request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
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
