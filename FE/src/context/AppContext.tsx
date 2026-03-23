import { createContext, useContext, useState, ReactNode } from 'react';
import { Course, User, Enrollment } from '../types';
import {
  initialCourses,
  initialUsers,
  initialEnrollments,
} from '../data/mockData';

interface AppContextType {
  courses: Course[];
  users: User[];
  enrollments: Enrollment[];
  currentUser: User;
  addCourse: (course: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => void;
  updateCourse: (id: number, data: Partial<Course>) => void;
  deleteCourse: (id: number) => void;
  addEnrollment: (userId: number, courseId: number) => void;
  cancelEnrollment: (enrollmentId: number) => void;
  addUser: (name: string, email: string, role?: string) => User;
  setCurrentUser: (user: User) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [enrollments, setEnrollments] =
    useState<Enrollment[]>(initialEnrollments);
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]);

  const addCourse = (
    courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>
  ) => {
    const newCourse: Course = {
      ...courseData,
      id: Math.max(0, ...courses.map((c) => c.id)) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCourses((prev) => [...prev, newCourse]);
  };

  const updateCourse = (id: number, data: Partial<Course>) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...data, updated_at: new Date().toISOString() } : c
      )
    );
  };

  const deleteCourse = (id: number) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setEnrollments((prev) => prev.filter((e) => e.course_id !== id));
  };

  const addEnrollment = (userId: number, courseId: number) => {
    const alreadyEnrolled = enrollments.some(
      (e) => e.user_id === userId && e.course_id === courseId
    );
    if (alreadyEnrolled) return;

    const newEnrollment: Enrollment = {
      id: Math.max(0, ...enrollments.map((e) => e.id)) + 1,
      user_id: userId,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
    };
    setEnrollments((prev) => [...prev, newEnrollment]);
  };

  const cancelEnrollment = (enrollmentId: number) => {
    setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
  };

  const addUser = (name: string, email: string, role = 'student'): User => {
    const newUser: User = {
      id: Math.max(0, ...users.map((u) => u.id)) + 1,
      name,
      email,
      role,
      created_at: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  return (
    <AppContext.Provider
      value={{
        courses,
        users,
        enrollments,
        currentUser,
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
