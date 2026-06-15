import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { enrollmentApi } from '../services/api';
import { Enrollment } from '../types';

function extractYouTubeId(url: string | undefined | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.hostname === 'youtu.be') {
      return u.pathname.replace(/^\//, '').split('/')[0] || null;
    }
    if (u.hostname.endsWith('youtube.com') || u.hostname.endsWith('youtube-nocookie.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const parts = u.pathname.split('/').filter(Boolean);
      const embedIdx = parts.indexOf('embed');
      if (embedIdx !== -1 && parts[embedIdx + 1]) return parts[embedIdx + 1];
      const shortsIdx = parts.indexOf('shorts');
      if (shortsIdx !== -1 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
    }
  } catch {
    return null;
  }
  return null;
}

export default function CourseWatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { courses, enrollments, enrollmentsLoaded, currentUser, updateEnrollmentInContext } = useApp();

  const courseId = Number(id);
  const course = courses.find((c) => c.id === courseId);
  const enrollment = currentUser
    ? enrollments.find((e) => e.user_id === currentUser.id && e.course_id === courseId)
    : undefined;

  const [progress, setProgress] = useState<number>(enrollment?.progress_percent ?? 0);
  const [saving, setSaving] = useState(false);
  const [latest, setLatest] = useState<Enrollment | undefined>(enrollment);

  useEffect(() => {
    if (enrollment) {
      setProgress(enrollment.progress_percent ?? 0);
      setLatest(enrollment);
    }
  }, [enrollment?.id]);

  const ytId = useMemo(() => extractYouTubeId(course?.youtube_url), [course?.youtube_url]);

  if (!currentUser) {
    return (
      <div style={styles.center}>
        <h2>로그인이 필요합니다.</h2>
        <button onClick={() => navigate('/login')} style={styles.primaryBtn}>
          로그인 하러 가기
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={styles.center}>
        <h2>강의를 찾을 수 없습니다.</h2>
        <Link to="/" style={styles.link}>강의 목록으로</Link>
      </div>
    );
  }

  if (!enrollment) {
    if (!enrollmentsLoaded) {
      return (
        <div style={styles.center}>
          <p>불러오는 중...</p>
        </div>
      );
    }
    return (
      <div style={styles.center}>
        <h2>이 강의는 수강 중이 아닙니다.</h2>
        <p style={{ color: '#777' }}>강의를 결제하면 수강할 수 있습니다.</p>
        <Link to={`/courses/${courseId}`} style={styles.link}>강의 상세로 이동</Link>
      </div>
    );
  }

  const save = async (next: number) => {
    setSaving(true);
    try {
      const clamped = Math.max(0, Math.min(100, Math.round(next)));
      const updated = await enrollmentApi.updateProgress(enrollment.id, {
        progress_percent: clamped,
      });
      setLatest(updated);
      setProgress(updated.progress_percent);
      updateEnrollmentInContext(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '진도율 저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    await save(100);
    alert('강의를 완료 처리했습니다.');
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.breadcrumb}>
          <Link to="/" style={styles.bcLink}>강의 목록</Link>
          {' > '}
          <Link to={`/courses/${courseId}`} style={styles.bcLink}>{course.title}</Link>
          {' > '}
          <span>수강</span>
        </div>

        <h1 style={styles.title}>{course.title}</h1>
        <p style={styles.instructor}>강사: {course.instructor}</p>

        <div style={styles.videoWrapper}>
          {ytId ? (
            <iframe
              title={`youtube-${ytId}`}
              src={`https://www.youtube.com/embed/${ytId}?rel=0`}
              style={styles.iframe}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              data-testid="course-video"
            />
          ) : (
            <div style={styles.noVideo}>
              <p style={{ fontWeight: 700, marginBottom: 8 }}>등록된 강의 영상이 없습니다.</p>
              <p style={{ color: '#777' }}>강사가 YouTube URL을 등록하면 영상이 표시됩니다.</p>
            </div>
          )}
        </div>

        <div style={styles.progressCard}>
          <h3 style={styles.sectionTitle}>나의 진도율</h3>
          <div style={styles.progressBar}>
            <div
              style={{ ...styles.progressFill, width: `${progress}%` }}
              data-testid="progress-fill"
            />
          </div>
          <div style={styles.progressRow}>
            <span style={styles.progressText} data-testid="progress-percent">
              {progress}%
            </span>
            {latest?.completed_at && (
              <span style={styles.completedBadge}>✓ 완료</span>
            )}
          </div>

          <label style={styles.label}>진도 설정 (%)</label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            style={{ width: '100%' }}
            data-testid="progress-slider"
          />
          <div style={styles.actions}>
            <button
              onClick={() => save(progress)}
              disabled={saving}
              style={styles.saveBtn}
              data-testid="save-progress-btn"
            >
              {saving ? '저장 중...' : '진도 저장'}
            </button>
            <button
              onClick={handleComplete}
              disabled={saving}
              style={styles.completeBtn}
              data-testid="complete-btn"
            >
              강의 완료 처리
            </button>
          </div>
          <p style={styles.hint}>
            영상을 시청한 후 진도율 슬라이더를 옮겨 "진도 저장"을 눌러주세요.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: '#f8f9fa', paddingBottom: '60px' },
  container: { maxWidth: '960px', margin: '0 auto', padding: '32px 20px' },
  breadcrumb: { fontSize: '0.875rem', color: '#888', marginBottom: '16px' },
  bcLink: { color: '#e94560', textDecoration: 'none' },
  title: { margin: '0 0 4px', fontSize: '1.6rem', fontWeight: 800, color: '#1a1a2e' },
  instructor: { margin: '0 0 20px', color: '#666' },
  videoWrapper: {
    position: 'relative',
    width: '100%',
    paddingTop: '56.25%',
    backgroundColor: '#000',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  iframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none',
  },
  noVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '20px',
  },
  progressCard: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  sectionTitle: { margin: '0 0 12px', fontSize: '1.1rem', color: '#1a1a2e' },
  progressBar: {
    width: '100%',
    height: '10px',
    backgroundColor: '#eee',
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: '6px',
    transition: 'width 0.2s',
  },
  progressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  progressText: { fontWeight: 700, color: '#1a1a2e' },
  completedBadge: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 700,
  },
  label: { display: 'block', fontSize: '0.85rem', color: '#444', fontWeight: 600, marginBottom: '6px' },
  actions: { display: 'flex', gap: '8px', marginTop: '14px' },
  saveBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  completeBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  hint: { fontSize: '0.78rem', color: '#888', marginTop: '12px' },
  center: { textAlign: 'center', padding: '80px 20px' },
  link: { color: '#e94560', textDecoration: 'none', fontWeight: 600 },
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
