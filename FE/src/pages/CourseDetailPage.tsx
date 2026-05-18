import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { courses, enrollments, cartItems, currentUser, addEnrollment, cancelEnrollment, deleteCourse, addToCart, removeFromCart } =
    useApp();

  const courseId = Number(id);
  const course = courses.find((c) => c.id === courseId);

  if (!course) {
    return (
      <div style={styles.notFound}>
        <h2>강의를 찾을 수 없습니다.</h2>
        <Link to="/" style={styles.backLink}>
          강의 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const canManageCourse =
    currentUser?.role === 'admin' ||
    (currentUser?.role === 'instructor' && course.instructor_id === currentUser.id);
  const canEnroll = currentUser?.role === 'student' || currentUser?.role === 'admin';

  const enrollment = currentUser
    ? enrollments.find((e) => e.user_id === currentUser.id && e.course_id === courseId)
    : undefined;
  const isEnrolled = !!enrollment;

  const cartItem = currentUser
    ? cartItems.find((ci) => ci.course_id === courseId)
    : undefined;
  const isInCart = !!cartItem;

  const enrolledCount = enrollments.filter((e) => e.course_id === courseId).length;

  const handleEnroll = async () => {
    if (!currentUser) {
      alert('수강 신청을 위해 회원가입이 필요합니다.');
      return;
    }
    try {
      await addEnrollment(currentUser.id, courseId);
      alert('수강 신청이 완료되었습니다!');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '수강 신청에 실패했습니다.');
    }
  };

  const handleCartToggle = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }
    try {
      if (isInCart) {
        await removeFromCart(cartItem!.id);
      } else {
        await addToCart(courseId);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '장바구니 처리에 실패했습니다.');
    }
  };

  const handleCancel = async () => {
    if (!enrollment) return;
    if (window.confirm('수강을 취소하시겠습니까?')) {
      try {
        await cancelEnrollment(enrollment.id);
        alert('수강이 취소되었습니다.');
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : '수강 취소에 실패했습니다.');
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('강의를 삭제하시겠습니까? 모든 수강 정보도 삭제됩니다.')) {
      try {
        await deleteCourse(courseId);
        navigate('/');
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : '강의 삭제에 실패했습니다.');
      }
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.breadcrumb}>
          <Link to="/" style={styles.breadcrumbLink}>
            강의 목록
          </Link>{' '}
          &gt; <span>{course.title}</span>
        </div>

        <div style={styles.layout}>
          <div style={styles.main}>
            <div style={styles.thumbnailWrapper}>
              <img
                src={course.thumbnail_url}
                alt={course.title}
                style={styles.thumbnail}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://placehold.co/800x450/cccccc/666?text=No+Image';
                }}
              />
              <span style={styles.categoryBadge}>{course.category}</span>
            </div>

            <div style={styles.content}>
              <h1 style={styles.title}>{course.title}</h1>
              <p style={styles.instructor}>강사: <strong>{course.instructor}</strong></p>
              <hr style={styles.divider} />
              <h3 style={styles.sectionTitle}>강의 소개</h3>
              <p style={styles.description}>{course.description}</p>
              <div style={styles.metaGrid}>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>카테고리</span>
                  <span style={styles.metaValue}>{course.category}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>수강 신청자</span>
                  <span style={styles.metaValue}>
                    {enrolledCount} / {course.max_students}명
                  </span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>등록일</span>
                  <span style={styles.metaValue}>{formatDate(course.created_at)}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>최종 수정</span>
                  <span style={styles.metaValue}>{formatDate(course.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.sidebar}>
            <div style={styles.sideCard}>
              <img
                src={course.thumbnail_url}
                alt=""
                style={styles.sideImage}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://placehold.co/400x225/cccccc/666?text=No+Image';
                }}
              />
              <div style={styles.sideBody}>
                <div style={styles.priceRow}>
                  <span style={styles.price}>{course.price.toLocaleString()}원</span>
                </div>
                <div style={styles.capacityBar}>
                  <div
                    style={{
                      ...styles.capacityFill,
                      width: `${Math.min(100, (enrolledCount / course.max_students) * 100)}%`,
                    }}
                  />
                </div>
                <p style={styles.capacityText}>
                  {enrolledCount}/{course.max_students}명 수강 중
                </p>

                {currentUser?.role === 'admin' && (
                  isEnrolled ? (
                    <button onClick={handleCancel} style={styles.cancelBtn}>
                      수강 취소
                    </button>
                  ) : (
                    <button
                      onClick={handleEnroll}
                      disabled={enrolledCount >= course.max_students}
                      style={{
                        ...styles.enrollBtn,
                        ...(enrolledCount >= course.max_students ? styles.enrollBtnDisabled : {}),
                      }}
                    >
                      {enrolledCount >= course.max_students ? '수강 마감' : '직접 수강 등록 (관리자)'}
                    </button>
                  )
                )}

                {currentUser?.role === 'student' && (
                  isEnrolled ? (
                    <button onClick={handleCancel} style={styles.cancelBtn}>
                      수강 취소
                    </button>
                  ) : enrolledCount >= course.max_students ? (
                    <button disabled style={{ ...styles.enrollBtn, ...styles.enrollBtnDisabled }}>
                      수강 마감
                    </button>
                  ) : (
                    <button
                      onClick={handleCartToggle}
                      style={isInCart ? styles.cartBtnActive : styles.cartBtn}
                    >
                      {isInCart ? '🛒 장바구니에서 제거' : '🛒 장바구니 담기'}
                    </button>
                  )
                )}

                {!currentUser && (
                  <button onClick={() => { alert('로그인이 필요합니다.'); }} style={styles.enrollBtn}>
                    수강 신청
                  </button>
                )}

                {isEnrolled && (
                  <div style={styles.enrolledNote}>✓ 수강 중인 강의입니다</div>
                )}

                {canManageCourse && (
                  <>
                    <hr style={styles.divider} />
                    <Link to={`/courses/${course.id}/students`} style={styles.studentsBtn}>
                      👥 수강생 목록 보기
                    </Link>
                    <div style={styles.sideActions}>
                      <Link to={`/courses/${course.id}/edit`} style={styles.editBtn}>
                        강의 수정
                      </Link>
                      <button onClick={handleDelete} style={styles.deleteBtn}>
                        강의 삭제
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    paddingBottom: '60px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 20px',
  },
  breadcrumb: {
    fontSize: '0.875rem',
    color: '#888',
    marginBottom: '24px',
  },
  breadcrumbLink: {
    color: '#e94560',
    textDecoration: 'none',
  },
  layout: {
    display: 'flex',
    gap: '32px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  main: {
    flex: '1 1 0',
    minWidth: '300px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    maxHeight: '360px',
    objectFit: 'cover',
    display: 'block',
  },
  categoryBadge: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    backgroundColor: '#e94560',
    color: '#fff',
    fontSize: '0.85rem',
    padding: '4px 14px',
    borderRadius: '20px',
    fontWeight: 600,
  },
  content: {
    padding: '28px',
  },
  title: {
    margin: '0 0 8px',
    fontSize: '1.6rem',
    fontWeight: 800,
    color: '#1a1a2e',
    lineHeight: 1.3,
  },
  instructor: {
    margin: '0 0 16px',
    color: '#666',
    fontSize: '1rem',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #eee',
    margin: '20px 0',
  },
  sectionTitle: {
    margin: '0 0 12px',
    fontSize: '1.1rem',
    color: '#1a1a2e',
  },
  description: {
    color: '#555',
    lineHeight: 1.7,
    fontSize: '0.95rem',
    marginBottom: '24px',
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    padding: '20px',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metaLabel: {
    fontSize: '0.78rem',
    color: '#999',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: '0.92rem',
    color: '#333',
    fontWeight: 500,
  },
  sidebar: {
    width: '300px',
    flexShrink: 0,
  },
  sideCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    position: 'sticky',
    top: '80px',
  },
  sideImage: {
    width: '100%',
    height: '160px',
    objectFit: 'cover',
    display: 'block',
  },
  sideBody: {
    padding: '20px',
  },
  priceRow: {
    marginBottom: '16px',
  },
  price: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#e94560',
  },
  capacityBar: {
    height: '6px',
    backgroundColor: '#eee',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '6px',
  },
  capacityFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: '3px',
    transition: 'width 0.3s',
  },
  capacityText: {
    fontSize: '0.82rem',
    color: '#888',
    marginBottom: '16px',
  },
  enrollBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: '8px',
  },
  enrollBtnDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  cancelBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: '8px',
  },
  cartBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#fff',
    color: '#e94560',
    border: '2px solid #e94560',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '8px',
  },
  cartBtnActive: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#fff5f7',
    color: '#e94560',
    border: '2px solid #e94560',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '8px',
  },
  enrolledNote: {
    textAlign: 'center',
    color: '#22c55e',
    fontSize: '0.875rem',
    fontWeight: 600,
    marginBottom: '8px',
  },
  studentsBtn: {
    display: 'block',
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#f0f4ff',
    color: '#0f3460',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
    marginBottom: '8px',
  },
  sideActions: {
    display: 'flex',
    gap: '8px',
  },
  editBtn: {
    flex: 1,
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#0f3460',
    color: '#fff',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  deleteBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  notFound: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#666',
  },
  backLink: {
    color: '#e94560',
    textDecoration: 'none',
    fontWeight: 600,
  },
};
