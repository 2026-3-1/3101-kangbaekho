import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { qnaApi, QuestionListItem } from '../services/api';

export default function CourseQnaPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const navigate = useNavigate();
  const { courses, currentUser } = useApp();
  const course = courses.find((c) => c.id === courseId);

  const [items, setItems] = useState<QuestionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    qnaApi
      .list(courseId)
      .then(setItems)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : '불러오기 실패'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!currentUser) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, currentUser?.id]);

  if (!currentUser) {
    return (
      <div style={styles.center}>
        <p>로그인이 필요합니다.</p>
        <button onClick={() => navigate('/login')} style={styles.primaryBtn}>
          로그인하기
        </button>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      alert('제목과 본문을 모두 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await qnaApi.create(courseId, { title: title.trim(), body });
      setTitle('');
      setBody('');
      setShowForm(false);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '질문 작성 실패');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.breadcrumb}>
          <Link to="/" style={styles.bcLink}>강의 목록</Link>
          {' > '}
          {course && (
            <Link to={`/courses/${courseId}`} style={styles.bcLink}>
              {course.title}
            </Link>
          )}
          {' > '}
          <span>Q&A</span>
        </div>

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>강의 Q&A</h1>
            {course && <p style={styles.subtitle}>{course.title}</p>}
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            style={styles.writeBtn}
            data-testid="toggle-write-btn"
          >
            {showForm ? '닫기' : '질문 작성'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={onSubmit} style={styles.form} data-testid="qna-form">
            <input
              type="text"
              placeholder="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
              maxLength={200}
              data-testid="qna-title"
            />
            <textarea
              placeholder="본문을 입력해주세요"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              style={styles.textarea}
              data-testid="qna-body"
            />
            <div style={{ textAlign: 'right' }}>
              <button
                type="submit"
                disabled={submitting}
                style={styles.submitBtn}
                data-testid="qna-submit"
              >
                {submitting ? '작성 중...' : '질문 등록'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div style={styles.center}>불러오는 중...</div>
        ) : error ? (
          <div style={{ ...styles.center, color: '#b91c1c' }}>{error}</div>
        ) : items.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>💬</div>
            <p>아직 등록된 질문이 없습니다. 첫 질문을 남겨보세요!</p>
          </div>
        ) : (
          <div style={styles.list}>
            {items.map((q) => (
              <Link
                key={q.id}
                to={`/qna/${q.id}`}
                style={styles.itemLink}
                data-testid={`qna-item-${q.id}`}
              >
                <div style={styles.itemRow}>
                  <div style={styles.itemMain}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...(q.is_answered ? styles.statusAnswered : styles.statusOpen),
                      }}
                    >
                      {q.is_answered ? `답변 ${q.answers_count}` : '답변 대기'}
                    </span>
                    <span style={styles.itemTitle}>{q.title}</span>
                  </div>
                  <div style={styles.itemMeta}>
                    <span>{q.author?.name ?? '알 수 없음'}</span>
                    <span style={styles.dot}>•</span>
                    <span>{new Date(q.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: '#f8f9fa', paddingBottom: '60px' },
  container: { maxWidth: '900px', margin: '0 auto', padding: '32px 20px' },
  breadcrumb: { fontSize: '0.875rem', color: '#888', marginBottom: '16px' },
  bcLink: { color: '#e94560', textDecoration: 'none' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: { margin: '0 0 4px', fontSize: '1.7rem', fontWeight: 800, color: '#1a1a2e' },
  subtitle: { margin: 0, color: '#888', fontSize: '0.95rem' },
  writeBtn: {
    padding: '10px 20px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  form: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1.5px solid #ddd',
    fontSize: '0.95rem',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  },
  textarea: {
    padding: '12px',
    borderRadius: '8px',
    border: '1.5px solid #ddd',
    fontSize: '0.95rem',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.6,
  },
  submitBtn: {
    padding: '10px 22px',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  itemLink: { textDecoration: 'none', color: 'inherit' },
  itemRow: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  itemMain: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 },
  itemTitle: {
    fontWeight: 700,
    color: '#1a1a2e',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemMeta: {
    fontSize: '0.82rem',
    color: '#888',
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  dot: { color: '#ccc' },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '999px',
    flexShrink: 0,
  },
  statusOpen: { backgroundColor: '#fef3c7', color: '#92400e' },
  statusAnswered: { backgroundColor: '#dcfce7', color: '#15803d' },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    color: '#888',
  },
  center: { textAlign: 'center', padding: '60px 20px', color: '#666' },
  primaryBtn: {
    marginTop: '20px',
    padding: '12px 28px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 700,
    cursor: 'pointer',
  },
};
