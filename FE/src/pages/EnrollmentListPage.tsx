import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function EnrollmentListPage() {
  const { enrollments, courses, currentUser, cancelEnrollment } = useApp();
  const navigate = useNavigate();

  if (!currentUser) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👤</div>
          <h2 style={{ color: '#1a1a2e', marginBottom: '12px' }}>로그인이 필요합니다</h2>
          <p style={{ color: '#888', marginBottom: '24px' }}>수강 목록을 보려면 먼저 로그인해주세요.</p>
          <button
            onClick={() => navigate('/login')}
            style={{ padding: '12px 28px', backgroundColor: '#e94560', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}
          >
            로그인 하러 가기
          </button>
        </div>
      </div>
    );
  }

  const enrolledCourses = enrollments.map((e) => ({
    enrollment: e,
    course: e.course ?? courses.find((c) => c.id === e.course_id),
  }));

  const handleCancel = async (enrollmentId: number, courseTitle?: string) => {
    if (
      window.confirm(
        `${courseTitle ? `"${courseTitle}" ` : ''}수강을 취소하시겠습니까?`
      )
    ) {
      try {
        await cancelEnrollment(enrollmentId);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : '수강 취소에 실패했습니다.');
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
      <div style={styles.header}>
        <h1 style={styles.heading}>내 수강 목록</h1>
        <p style={styles.subheading}>
          현재 수강 중인 강의 목록입니다. 현재 사용자:{' '}
          <strong>{currentUser!.name}</strong> ({currentUser!.email})
        </p>
      </div>

      <div style={styles.container}>
        {enrolledCourses.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>📭</div>
            <h3>수강 중인 강의가 없습니다.</h3>
            <p>마음에 드는 강의를 찾아 수강 신청해보세요!</p>
            <Link to="/" style={styles.browseLink}>
              강의 목록 보기
            </Link>
          </div>
        ) : (
          <>
            <p style={styles.countText}>
              총 <strong>{enrolledCourses.length}</strong>개의 강의를 수강 중입니다.
            </p>
            <div style={styles.list}>
              {enrolledCourses.map(({ enrollment, course }) =>
                course ? (
                  <div key={enrollment.id} style={styles.card}>
                    <div style={styles.thumbnailWrapper}>
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        style={styles.thumbnail}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://placehold.co/200x120/cccccc/666?text=No+Image';
                        }}
                      />
                    </div>
                    <div style={styles.cardBody}>
                      <div style={styles.cardTop}>
                        <span style={styles.categoryBadge}>
                          {course.category}
                        </span>
                        <span style={styles.enrolledDate}>
                          수강 시작: {formatDate(enrollment.enrolled_at)}
                        </span>
                      </div>
                      <h3 style={styles.courseTitle}>{course.title}</h3>
                      <p style={styles.instructor}>강사: {course.instructor}</p>
                      <p style={styles.description}>{course.description}</p>
                      <div
                        style={styles.progressWrapper}
                        data-testid={`enrollment-progress-${enrollment.id}`}
                      >
                        <div style={styles.progressLabel}>
                          <span>진도율</span>
                          <span style={styles.progressValue}>
                            {enrollment.progress_percent ?? 0}%
                            {enrollment.completed_at ? ' · ✓ 완료' : ''}
                          </span>
                        </div>
                        <div style={styles.progressBar}>
                          <div
                            style={{
                              ...styles.progressFill,
                              width: `${enrollment.progress_percent ?? 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div style={styles.cardFooter}>
                        <span style={styles.price}>
                          {course.price.toLocaleString()}원
                        </span>
                        <div style={styles.actions}>
                          <Link
                            to={`/courses/${course.id}/watch`}
                            style={styles.watchBtn}
                            data-testid={`watch-link-${enrollment.id}`}
                          >
                            ▶ 강의 수강
                          </Link>
                          <Link
                            to={`/courses/${course.id}`}
                            style={styles.detailBtn}
                          >
                            강의 상세
                          </Link>
                          <button
                            onClick={() =>
                              handleCancel(enrollment.id, course.title)
                            }
                            style={styles.cancelBtn}
                          >
                            수강 취소
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </>
        )}
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
  header: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: '40px 20px',
  },
  heading: {
    margin: '0 0 8px',
    fontSize: '1.8rem',
    fontWeight: 800,
  },
  subheading: {
    margin: 0,
    color: '#aaa',
    fontSize: '0.95rem',
  },
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '32px 20px',
  },
  countText: {
    color: '#666',
    marginBottom: '20px',
    fontSize: '0.9rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'row',
  },
  thumbnailWrapper: {
    flexShrink: 0,
  },
  thumbnail: {
    width: '200px',
    height: '140px',
    objectFit: 'cover',
    display: 'block',
  },
  cardBody: {
    padding: '20px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#e94560',
    color: '#fff',
    fontSize: '0.75rem',
    padding: '2px 10px',
    borderRadius: '20px',
    fontWeight: 600,
  },
  enrolledDate: {
    fontSize: '0.8rem',
    color: '#999',
  },
  courseTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#1a1a2e',
  },
  instructor: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#666',
  },
  description: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#777',
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    flex: 1,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
  },
  price: {
    fontWeight: 700,
    color: '#e94560',
    fontSize: '1rem',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  detailBtn: {
    padding: '7px 16px',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  watchBtn: {
    padding: '7px 16px',
    backgroundColor: '#22c55e',
    color: '#fff',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  progressWrapper: {
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.78rem',
    color: '#666',
    fontWeight: 600,
  },
  progressValue: {
    color: '#22c55e',
    fontWeight: 700,
  },
  progressBar: {
    width: '100%',
    height: '6px',
    backgroundColor: '#eee',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    transition: 'width 0.3s',
  },
  cancelBtn: {
    padding: '7px 16px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  empty: {
    textAlign: 'center',
    padding: '80px 20px',
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '16px',
  },
  browseLink: {
    display: 'inline-block',
    marginTop: '16px',
    padding: '12px 28px',
    backgroundColor: '#e94560',
    color: '#fff',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: 700,
  },
};
