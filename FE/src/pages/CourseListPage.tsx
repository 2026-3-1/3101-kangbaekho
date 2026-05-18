import { useState } from 'react';
import { useApp } from '../context/AppContext';
import CourseCard from '../components/CourseCard';

const ITEMS_PER_PAGE = 6;

export default function CourseListPage() {
  const { courses, enrollments, cartItems, currentUser, deleteCourse, addToCart, removeFromCart } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    '전체',
    ...Array.from(new Set(courses.map((c) => c.category))),
  ];

  const filteredCourses = courses.filter((c) => {
    const matchCategory =
      selectedCategory === '전체' || c.category === selectedCategory;
    const matchSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginated = filteredCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const canManageCourse = (courseInstructorId: number) =>
    currentUser?.role === 'admin' ||
    (currentUser?.role === 'instructor' && courseInstructorId === currentUser.id);
  const canUseCart = currentUser?.role === 'student' || currentUser?.role === 'admin';

  const enrolledIds = new Set(
    currentUser
      ? enrollments.filter((e) => e.user_id === currentUser.id).map((e) => e.course_id)
      : [],
  );

  const cartCourseIds = new Set(cartItems.map((ci) => ci.course_id));

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('강의를 삭제하시겠습니까?')) {
      deleteCourse(id);
    }
  };

  const handleCartToggle = async (courseId: number) => {
    try {
      if (cartCourseIds.has(courseId)) {
        const item = cartItems.find((ci) => ci.course_id === courseId);
        if (item) await removeFromCart(item.id);
      } else {
        await addToCart(courseId);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '장바구니 처리에 실패했습니다.');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>강의 목록</h1>
        <p style={styles.heroSub}>원하는 강의를 찾아 시작하세요</p>
        <input
          type="text"
          placeholder="강의명 또는 강사 검색..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          style={styles.searchInput}
        />
      </div>

      <div style={styles.container}>
        <div style={styles.filterRow}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              style={{
                ...styles.filterBtn,
                ...(selectedCategory === cat ? styles.filterBtnActive : {}),
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <p style={styles.resultCount}>
          총 <strong>{filteredCourses.length}</strong>개의 강의
        </p>

        {paginated.length === 0 ? (
          <div style={styles.empty}>
            <p>검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {paginated.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isEnrolled={enrolledIds.has(course.id)}
                isInCart={cartCourseIds.has(course.id)}
                canEdit={canManageCourse(course.instructor_id)}
                canDelete={canManageCourse(course.instructor_id)}
                canUseCart={canUseCart}
                canViewStudents={canManageCourse(course.instructor_id)}
                onDelete={handleDelete}
                onCartToggle={handleCartToggle}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={styles.pagination}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                ...styles.pageBtn,
                ...(currentPage === 1 ? styles.pageBtnDisabled : {}),
              }}
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                style={{
                  ...styles.pageBtn,
                  ...(currentPage === p ? styles.pageBtnActive : {}),
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                ...styles.pageBtn,
                ...(currentPage === totalPages ? styles.pageBtnDisabled : {}),
              }}
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
  },
  hero: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    textAlign: 'center',
    padding: '48px 20px',
  },
  heroTitle: {
    margin: '0 0 8px',
    fontSize: '2rem',
    fontWeight: 800,
  },
  heroSub: {
    margin: '0 0 24px',
    color: '#aaa',
    fontSize: '1rem',
  },
  searchInput: {
    width: '100%',
    maxWidth: '480px',
    padding: '12px 20px',
    borderRadius: '30px',
    border: 'none',
    fontSize: '1rem',
    outline: 'none',
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 20px',
  },
  filterRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '20px',
  },
  filterBtn: {
    padding: '7px 18px',
    borderRadius: '20px',
    border: '2px solid #ddd',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#555',
    transition: 'all 0.15s',
  },
  filterBtnActive: {
    backgroundColor: '#e94560',
    borderColor: '#e94560',
    color: '#fff',
    fontWeight: 700,
  },
  resultCount: {
    color: '#666',
    marginBottom: '20px',
    fontSize: '0.9rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
  empty: {
    textAlign: 'center',
    padding: '60px',
    color: '#aaa',
    fontSize: '1.1rem',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '40px',
  },
  pageBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  pageBtnActive: {
    backgroundColor: '#e94560',
    color: '#fff',
    border: '1px solid #e94560',
    fontWeight: 700,
  },
  pageBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
};
