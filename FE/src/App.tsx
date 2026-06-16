import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, ReactNode, Suspense } from 'react';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import CourseListPage from './pages/CourseListPage';
import LoginPage from './pages/LoginPage';

// 비-즉시-필요 화면들은 lazy 로드해 초기 번들 크기를 줄인다.
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'));
const CourseFormPage = lazy(() => import('./pages/CourseFormPage'));
const EnrollmentListPage = lazy(() => import('./pages/EnrollmentListPage'));
const UserRegisterPage = lazy(() => import('./pages/UserRegisterPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const CourseStudentsPage = lazy(() => import('./pages/CourseStudentsPage'));
const CourseWatchPage = lazy(() => import('./pages/CourseWatchPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentFailPage = lazy(() => import('./pages/PaymentFailPage'));
const CourseQnaPage = lazy(() => import('./pages/CourseQnaPage'));
const QuestionDetailPage = lazy(() => import('./pages/QuestionDetailPage'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('./admin/AdminUsersPage'));
const AdminPaymentsPage = lazy(() => import('./admin/AdminPaymentsPage'));
const AdminLogsPage = lazy(() => import('./admin/AdminLogsPage'));

function MaybeNavbar() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;
  return <Navbar />;
}

function Admin({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}

function Loading() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#888',
      }}
    >
      불러오는 중...
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <MaybeNavbar />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<CourseListPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/users/register" element={<UserRegisterPage />} />
            <Route path="/courses/new" element={<CourseFormPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route path="/courses/:id/edit" element={<CourseFormPage />} />
            <Route path="/enrollments" element={<EnrollmentListPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/courses/:id/students" element={<CourseStudentsPage />} />
            <Route path="/courses/:id/watch" element={<CourseWatchPage />} />
            <Route path="/courses/:id/qna" element={<CourseQnaPage />} />
            <Route path="/qna/:id" element={<QuestionDetailPage />} />
            <Route path="/payments/success" element={<PaymentSuccessPage />} />
            <Route path="/payments/fail" element={<PaymentFailPage />} />

            <Route path="/admin" element={<Admin><AdminDashboardPage /></Admin>} />
            <Route path="/admin/users" element={<Admin><AdminUsersPage /></Admin>} />
            <Route path="/admin/payments" element={<Admin><AdminPaymentsPage /></Admin>} />
            <Route path="/admin/logs" element={<Admin><AdminLogsPage /></Admin>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
