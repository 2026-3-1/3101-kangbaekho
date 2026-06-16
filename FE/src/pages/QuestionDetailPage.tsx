import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { qnaApi, QuestionDetail } from '../services/api';

function roleLabel(role?: string | null): string {
  if (role === 'admin') return '👑 관리자';
  if (role === 'instructor') return '🎓 강사';
  return '👤 학생';
}

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const questionId = Number(id);
  const navigate = useNavigate();
  const { currentUser, courses } = useApp();

  const [data, setData] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answerBody, setAnswerBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    qnaApi
      .detail(questionId)
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : '불러오기 실패'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!currentUser) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId, currentUser?.id]);

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

  if (loading) return <div style={styles.center}>불러오는 중...</div>;
  if (error)
    return <div style={{ ...styles.center, color: '#b91c1c' }}>{error}</div>;
  if (!data) return <div style={styles.center}>질문을 찾을 수 없습니다.</div>;

  const course = courses.find((c) => c.id === data.course_id);
  const canAnswer =
    currentUser.role === 'admin' ||
    (currentUser.role === 'instructor' && course?.instructor_id === currentUser.id);
  const isAuthor = data.author?.id === currentUser.id;
  const isAdmin = currentUser.role === 'admin';
  const canDeleteQuestion =
    isAuthor ||
    isAdmin ||
    (currentUser.role === 'instructor' && course?.instructor_id === currentUser.id);

  const handleAddAnswer = async (e: FormEvent) => {
    e.preventDefault();
    if (!answerBody.trim()) return;
    setSubmitting(true);
    try {
      await qnaApi.addAnswer(questionId, { body: answerBody });
      setAnswerBody('');
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '답변 작성 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!window.confirm('질문을 삭제하시겠습니까? 답변도 함께 삭제됩니다.')) return;
    try {
      await qnaApi.deleteQuestion(questionId);
      navigate(`/courses/${data.course_id}/qna`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '삭제 실패');
    }
  };

  const handleDeleteAnswer = async (answerId: number) => {
    if (!window.confirm('답변을 삭제하시겠습니까?')) return;
    try {
      await qnaApi.deleteAnswer(answerId);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '삭제 실패');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.breadcrumb}>
          <Link to="/" style={styles.bcLink}>강의 목록</Link>
          {' > '}
          {course && (
            <Link to={`/courses/${course.id}`} style={styles.bcLink}>
              {course.title}
            </Link>
          )}
          {' > '}
          <Link to={`/courses/${data.course_id}/qna`} style={styles.bcLink}>Q&A</Link>
          {' > '}
          <span>질문 상세</span>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h1 style={styles.title}>{data.title}</h1>
            {canDeleteQuestion && (
              <button onClick={handleDeleteQuestion} style={styles.dangerBtn}>
                질문 삭제
              </button>
            )}
          </div>
          <div style={styles.meta}>
            <span>{roleLabel(data.author?.role)} {data.author?.name ?? '알 수 없음'}</span>
            <span style={styles.dot}>•</span>
            <span>{new Date(data.created_at).toLocaleString('ko-KR')}</span>
          </div>
          <p style={styles.body}>{data.body}</p>
        </div>

        <h2 style={styles.section}>답변 {data.answers.length}개</h2>
        {data.answers.length === 0 ? (
          <div style={styles.empty}>아직 답변이 없습니다.</div>
        ) : (
          <div style={styles.answerList}>
            {data.answers.map((a) => (
              <div key={a.id} style={styles.answerCard} data-testid={`answer-${a.id}`}>
                <div style={styles.answerHead}>
                  <span style={styles.answerAuthor}>
                    {roleLabel(a.author?.role)} {a.author?.name ?? '알 수 없음'}
                  </span>
                  <span style={styles.answerDate}>
                    {new Date(a.created_at).toLocaleString('ko-KR')}
                  </span>
                  {(a.author?.id === currentUser.id || isAdmin) && (
                    <button
                      onClick={() => handleDeleteAnswer(a.id)}
                      style={styles.smallDangerBtn}
                    >
                      삭제
                    </button>
                  )}
                </div>
                <p style={styles.answerBody}>{a.body}</p>
              </div>
            ))}
          </div>
        )}

        {canAnswer ? (
          <form onSubmit={handleAddAnswer} style={styles.form} data-testid="answer-form">
            <h3 style={styles.formTitle}>답변 작성</h3>
            <textarea
              value={answerBody}
              onChange={(e) => setAnswerBody(e.target.value)}
              rows={4}
              placeholder="답변을 입력해주세요"
              style={styles.textarea}
              data-testid="answer-body"
            />
            <div style={{ textAlign: 'right' }}>
              <button
                type="submit"
                disabled={submitting || !answerBody.trim()}
                style={styles.submitBtn}
                data-testid="answer-submit"
              >
                {submitting ? '저장 중...' : '답변 등록'}
              </button>
            </div>
          </form>
        ) : (
          <p style={styles.noticeText}>
            ※ 답변은 해당 강의의 강사 또는 관리자만 작성할 수 있습니다.
          </p>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    padding: '24px',
    marginBottom: '24px',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
  title: { margin: '0 0 8px', fontSize: '1.4rem', color: '#1a1a2e' },
  meta: { display: 'flex', gap: '8px', alignItems: 'center', color: '#888', fontSize: '0.85rem', marginBottom: '16px' },
  dot: { color: '#ddd' },
  body: { color: '#333', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.95rem' },
  section: { margin: '0 0 12px', fontSize: '1.05rem', color: '#1a1a2e' },
  answerList: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' },
  answerCard: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    padding: '18px',
  },
  answerHead: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  answerAuthor: { fontWeight: 700, color: '#1a1a2e', fontSize: '0.9rem' },
  answerDate: { color: '#999', fontSize: '0.78rem', flex: 1 },
  answerBody: { margin: 0, color: '#444', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.92rem' },
  empty: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '24px',
    textAlign: 'center',
    color: '#888',
    marginBottom: '24px',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formTitle: { margin: 0, fontSize: '1rem', color: '#1a1a2e' },
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
  dangerBtn: {
    padding: '6px 14px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '0.82rem',
  },
  smallDangerBtn: {
    padding: '4px 10px',
    backgroundColor: 'transparent',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  noticeText: { color: '#888', fontSize: '0.85rem', textAlign: 'center', marginTop: '24px' },
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
