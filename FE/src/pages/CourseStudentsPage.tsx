import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { courseEnrollmentApi, CourseEnrollmentStudent } from '../services/api';

export default function CourseStudentsPage() {
  const { id } = useParams<{ id: string }>();
  const { courses, currentUser } = useApp();
  const courseId = Number(id);
  const course = courses.find((c) => c.id === courseId);

  const [students, setStudents] = useState<CourseEnrollmentStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    courseEnrollmentApi
      .getStudents(courseId)
      .then(setStudents)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '불러오기 실패'))
      .finally(() => setLoading(false));
  }, [courseId, currentUser]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  if (!currentUser || (currentUser.role !== 'instructor' && currentUser.role !== 'admin')) {
    return (
      <div style={styles.center}>
        <p>접근 권한이 없습니다.</p>
        <Link to="/" style={styles.link}>홈으로</Link>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.breadcrumb}>
          <Link to="/" style={styles.breadcrumbLink}>강의 목록</Link>
          {' > '}
          {course && <Link to={`/courses/${courseId}`} style={styles.breadcrumbLink}>{course.title}</Link>}
          {' > '}
          <span>수강생 목록</span>
        </div>

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>수강생 목록</h1>
            {course && <p style={styles.subtitle}>{course.title}</p>}
          </div>
          <div style={styles.countBadge}>
            총 <strong>{students.length}</strong>명
          </div>
        </div>

        {loading ? (
          <div style={styles.center}><p>불러오는 중...</p></div>
        ) : error ? (
          <div style={styles.center}><p style={{ color: '#e94560' }}>{error}</p></div>
        ) : students.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>👥</div>
            <p>아직 수강 신청한 학생이 없습니다.</p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>이름</th>
                  <th style={styles.th}>이메일</th>
                  <th style={styles.th}>수강 등록일</th>
                  <th style={styles.th}>진도율</th>
                  <th style={styles.th}>상태</th>
                </tr>
              </thead>
              <tbody>
                {students.map((item, index) => {
                  const percent = item.progress_percent ?? 0;
                  return (
                    <tr
                      key={item.enrollment_id}
                      style={styles.tr}
                      data-testid={`student-row-${item.enrollment_id}`}
                    >
                      <td style={styles.td}>{index + 1}</td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>
                        {item.student?.name ?? '-'}
                      </td>
                      <td style={styles.td}>{item.student?.email ?? '-'}</td>
                      <td style={styles.td}>{formatDate(item.enrolled_at)}</td>
                      <td style={styles.td}>
                        <div style={styles.progressCell}>
                          <div style={styles.progressBar}>
                            <div
                              style={{
                                ...styles.progressFill,
                                width: `${percent}%`,
                              }}
                            />
                          </div>
                          <span
                            style={styles.progressNumber}
                            data-testid={`student-progress-${item.enrollment_id}`}
                          >
                            {percent}%
                          </span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        {item.completed_at ? (
                          <span style={styles.completedTag}>✓ 완료</span>
                        ) : percent > 0 ? (
                          <span style={styles.inProgressTag}>수강 중</span>
                        ) : (
                          <span style={styles.notStartedTag}>미시작</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
    paddingBottom: '60px',
  },
  container: {
    maxWidth: '900px',
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: {
    margin: '0 0 4px',
    fontSize: '1.8rem',
    fontWeight: 800,
    color: '#1a1a2e',
  },
  subtitle: {
    margin: 0,
    fontSize: '1rem',
    color: '#888',
  },
  countBadge: {
    backgroundColor: '#fff',
    border: '1.5px solid #e94560',
    color: '#e94560',
    padding: '8px 20px',
    borderRadius: '20px',
    fontSize: '0.95rem',
  },
  center: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    color: '#888',
  },
  emptyIcon: {
    fontSize: '2.5rem',
    marginBottom: '12px',
  },
  link: {
    color: '#e94560',
    textDecoration: 'none',
    fontWeight: 600,
  },
  tableWrapper: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  thead: {
    backgroundColor: '#1a1a2e',
  },
  th: {
    padding: '14px 20px',
    textAlign: 'left',
    color: '#fff',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  tr: {
    borderBottom: '1px solid #f0f0f0',
  },
  td: {
    padding: '14px 20px',
    fontSize: '0.92rem',
    color: '#333',
  },
  progressCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: '160px',
  },
  progressBar: {
    flex: 1,
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
  progressNumber: {
    fontWeight: 700,
    fontSize: '0.85rem',
    color: '#1a1a2e',
    minWidth: '40px',
    textAlign: 'right',
  },
  completedTag: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '0.78rem',
    fontWeight: 700,
  },
  inProgressTag: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '0.78rem',
    fontWeight: 700,
  },
  notStartedTag: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '0.78rem',
    fontWeight: 700,
  },
};
