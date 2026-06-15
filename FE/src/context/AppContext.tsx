import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Course, User, Enrollment, Payment } from '../types';
import { authApi, cartApi, courseApi, userApi, enrollmentApi, paymentApi } from '../services/api';

interface AppContextType {
  courses: Course[];
  enrollments: Enrollment[];
  enrollmentsLoaded: boolean;
  cartItems: CartItem[];
  currentUser: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  addCourse: (course: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCourse: (id: number, data: Partial<Course>) => Promise<void>;
  deleteCourse: (id: number) => Promise<void>;
  addEnrollment: (userId: number, courseId: number) => Promise<void>;
  cancelEnrollment: (enrollmentId: number) => Promise<void>;
  refreshEnrollments: () => Promise<void>;
  refreshCart: () => Promise<void>;
  updateEnrollmentInContext: (enrollment: Enrollment) => void;
  addToCart: (courseId: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  checkout: (courseIds: number[]) => Promise<Payment>;
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
  const [enrollmentsLoaded, setEnrollmentsLoaded] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUserState] = useState<User | null>(loadStoredUser);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    courseApi
      .getAll()
      .then((res) => setCourses(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!currentUser || !token) {
      setEnrollments([]);
      setCartItems([]);
      setEnrollmentsLoaded(true);
      return;
    }
    setEnrollmentsLoaded(false);
    userApi
      .getEnrollments(currentUser.id)
      .then((res) => {
        setEnrollments(res);
      })
      .catch(() => setEnrollments([]))
      .finally(() => setEnrollmentsLoaded(true));

    if (currentUser.role === 'student' || currentUser.role === 'admin') {
      cartApi
        .getCart()
        .then(setCartItems)
        .catch(() => setCartItems([]));
    }
  }, [currentUser, token]);

  const refreshEnrollments = async () => {
    if (!currentUser) return;
    try {
      const res = await userApi.getEnrollments(currentUser.id);
      setEnrollments(res);
    } catch {
      // ignore
    }
  };

  const refreshCart = async () => {
    if (!currentUser) return;
    try {
      const res = await cartApi.getCart();
      setCartItems(res);
    } catch {
      // ignore
    }
  };

  const updateEnrollmentInContext = (enrollment: Enrollment) => {
    setEnrollments((prev) =>
      prev.map((e) => (e.id === enrollment.id ? { ...e, ...enrollment } : e)),
    );
  };

  const saveAuth = (user: User, accessToken: string) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('access_token', accessToken);
    setCurrentUserState(user);
    setToken(accessToken);
  };

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    saveAuth(res.user, res.access_token);
  };

  const register = async (name: string, email: string, password: string, role = 'student') => {
    const res = await authApi.register({ name, email, password, role });
    saveAuth(res.user, res.access_token);
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('access_token');
    setCurrentUserState(null);
    setToken(null);
    setEnrollments([]);
    setCartItems([]);
  };

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
    setCartItems((prev) => prev.filter((ci) => ci.course_id !== id));
  };

  const addEnrollment = async (userId: number, courseId: number) => {
    const created = await enrollmentApi.create(userId, courseId);
    const course = courses.find((c) => c.id === courseId);
    setEnrollments((prev) => [...prev, { ...created, course }]);
    setCartItems((prev) => prev.filter((ci) => ci.course_id !== courseId));
  };

  const cancelEnrollment = async (enrollmentId: number) => {
    await enrollmentApi.cancel(enrollmentId);
    setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
  };

  const addToCart = async (courseId: number) => {
    const item = await cartApi.addItem(courseId);
    const course = courses.find((c) => c.id === courseId);
    setCartItems((prev) => [...prev, { ...item, course: course! }]);
  };

  const removeFromCart = async (itemId: number) => {
    await cartApi.removeItem(itemId);
    setCartItems((prev) => prev.filter((ci) => ci.id !== itemId));
  };

  const clearCart = async () => {
    await cartApi.clearCart();
    setCartItems([]);
  };

  const checkout = async (courseIds: number[]): Promise<Payment> => {
    const payment = await paymentApi.checkout(courseIds);
    setCartItems((prev) => prev.filter((ci) => !courseIds.includes(ci.course_id)));
    await refreshEnrollments();
    return payment;
  };

  return (
    <AppContext.Provider
      value={{
        courses,
        enrollments,
        enrollmentsLoaded,
        cartItems,
        currentUser,
        token,
        loading,
        error,
        login,
        logout,
        register,
        addCourse,
        updateCourse,
        deleteCourse,
        addEnrollment,
        cancelEnrollment,
        refreshEnrollments,
        refreshCart,
        updateEnrollmentInContext,
        addToCart,
        removeFromCart,
        clearCart,
        checkout,
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
