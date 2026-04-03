import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Course, User, Enrollment } from '../types';
import { courseApi, userApi, enrollmentApi } from '../services/api';

interface AppContextType {
  courses: Course[];
  enrollments: Enrollment[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  addCourse: (course: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCourse: (id: number, data: Partial<Course>) => Promise<void>;
  deleteCourse: (id: number) => Promise<void>;
  addEnrollment: (userId: number, courseId: number) => Promise<void>;
  cancelEnrollment: (enrollmentId: number) => Promise<void>;
  addUser: (name: string, email: string, role?: string) => Promise<User>;
  setCurrentUser: (user: User) => void;
}

const AppContext = createContext<AppContextType | null>(null);

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [currentUser, setCurrentUserState] = useState<User | null>(loadStoredUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setCurrentUser = (user: User) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUserState(user);
  };

  // 강의 목록 로드
  useEffect(() => {
    courseApi
      .getAll()
      .then((res) => setCourses(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // 현재 사용자의 수강 목록 로드
  useEffect(() => {
    if (!currentUser) {
      setEnrollments([]);
      return;
    }
    userApi
      .getEnrollments(currentUser.id)
      .then(setEnrollments)
      .catch(() => setEnrollments([]));
  }, [currentUser]);

  const addCourse = async (courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => {
    const created = await courseApi.create(courseData);
    setCourses((prev) => [...prev, created]);
  };

  const updateCourse = async (id: number, data: Partial<Course>) => {
    const updated = await courseApi.update(id, data);
    setCourses((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const deleteCourse = async (id: number) => {
    await courseApi.delete(id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setEnrollments((prev) => prev.filter((e) => e.course_id !== id));
  };

  const addEnrollment = async (userId: number, courseId: number) => {
    const created = await enrollmentApi.create(userId, courseId);
    const course = courses.find((c) => c.id === courseId);
    setEnrollments((prev) => [...prev, { ...created, course }]);
  };

  const cancelEnrollment = async (enrollmentId: number) => {
    await enrollmentApi.cancel(enrollmentId);
    setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
  };

  const addUser = async (name: string, email: string, role = 'student'): Promise<User> => {
    return userApi.create({ name, email, role });
  };

  return (
    <AppContext.Provider
      value={{
        courses,
        enrollments,
        currentUser,
        loading,
        error,
        addCourse,
        updateCourse,
        deleteCourse,
        addEnrollment,
        cancelEnrollment,
        addUser,
        setCurrentUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
