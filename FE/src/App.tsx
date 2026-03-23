import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import CourseListPage from './pages/CourseListPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CourseFormPage from './pages/CourseFormPage';
import EnrollmentListPage from './pages/EnrollmentListPage';
import UserRegisterPage from './pages/UserRegisterPage';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<CourseListPage />} />
          <Route path="/courses/new" element={<CourseFormPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/courses/:id/edit" element={<CourseFormPage />} />
          <Route path="/enrollments" element={<EnrollmentListPage />} />
          <Route path="/users/register" element={<UserRegisterPage />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
