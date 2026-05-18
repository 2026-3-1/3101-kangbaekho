import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useApp();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.email.trim()) newErrors.email = '이메일을 입력해주세요.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = '유효한 이메일 형식이 아닙니다.';
    if (!form.password) newErrors.password = '비밀번호를 입력해주세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '로그인에 실패했습니다.';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.cardHeader}>
          <div style={styles.iconWrapper}>🔐</div>
          <h1 style={styles.heading}>로그인</h1>
          <p style={styles.subheading}>온라인 강의 플랫폼</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {errors.general && <div style={styles.generalError}>{errors.general}</div>}

          <div style={styles.field}>
            <label style={styles.label}>이메일</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm((p) => ({ ...p, email: e.target.value }));
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="example@email.com"
              style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
            />
            {errors.email && <span style={styles.error}>{errors.email}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>비밀번호</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => {
                setForm((p) => ({ ...p, password: e.target.value }));
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              }}
              placeholder="비밀번호 입력"
              style={{ ...styles.input, ...(errors.password ? styles.inputError : {}) }}
            />
            {errors.password && <span style={styles.error}>{errors.password}</span>}
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <p style={styles.notice}>
            계정이 없으신가요?{' '}
            <Link to="/users/register" style={styles.link}>회원가입</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    width: '100%',
    maxWidth: '440px',
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    textAlign: 'center',
    padding: '36px 32px 28px',
  },
  iconWrapper: { fontSize: '3rem', marginBottom: '12px' },
  heading: { margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 800 },
  subheading: { margin: 0, color: '#aaa', fontSize: '0.875rem' },
  form: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  generalError: {
    backgroundColor: '#fff0f0',
    border: '1px solid #e94560',
    borderRadius: '8px',
    padding: '12px',
    color: '#e94560',
    fontSize: '0.875rem',
    textAlign: 'center',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.875rem', fontWeight: 600, color: '#444' },
  input: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1.5px solid #ddd',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputError: { borderColor: '#e94560' },
  error: { color: '#e94560', fontSize: '0.8rem', fontWeight: 500 },
  submitBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  notice: { margin: 0, fontSize: '0.875rem', color: '#666', textAlign: 'center' },
  link: { color: '#e94560', fontWeight: 600, textDecoration: 'none' },
};
