import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function UserRegisterPage() {
  const navigate = useNavigate();
  const { register } = useApp();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [errors, setErrors] = useState<{
    name?: string; email?: string; password?: string; general?: string;
  }>({});
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.name.trim()) newErrors.name = '이름을 입력해주세요.';
    if (!form.email.trim()) newErrors.email = '이메일을 입력해주세요.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = '유효한 이메일 형식이 아닙니다.';
    if (!form.password) newErrors.password = '비밀번호를 입력해주세요.';
    else if (form.password.length < 6) newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register(form.name, form.email, form.password, form.role);
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '회원가입에 실패했습니다.';
      setErrors((p) => ({ ...p, general: msg }));
    }
  };

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>🎉</div>
          <h2 style={styles.successTitle}>회원 가입 완료!</h2>
          <p style={styles.successMessage}><strong>{form.name}</strong>님, 환영합니다!</p>
          <p style={styles.successSub}>잠시 후 강의 목록으로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.cardHeader}>
          <div style={styles.iconWrapper}>👤</div>
          <h1 style={styles.heading}>회원 가입</h1>
          <p style={styles.subheading}>온라인 강의 플랫폼에 오신 것을 환영합니다</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {errors.general && <div style={styles.generalError}>{errors.general}</div>}

          <div style={styles.field}>
            <label style={styles.label}>이름 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setErrors((p) => ({ ...p, name: undefined })); }}
              placeholder="홍길동"
              style={{ ...styles.input, ...(errors.name ? styles.inputError : {}) }}
            />
            {errors.name && <span style={styles.error}>{errors.name}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>이메일 *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setErrors((p) => ({ ...p, email: undefined })); }}
              placeholder="example@email.com"
              style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
            />
            {errors.email && <span style={styles.error}>{errors.email}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>비밀번호 * (최소 6자)</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); setErrors((p) => ({ ...p, password: undefined })); }}
              placeholder="비밀번호 입력"
              style={{ ...styles.input, ...(errors.password ? styles.inputError : {}) }}
            />
            {errors.password && <span style={styles.error}>{errors.password}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>역할</label>
            <div style={styles.roleGroup}>
              {[
                { value: 'student', label: '학생' },
                { value: 'instructor', label: '강사' },
                { value: 'admin', label: '관리자' },
              ].map(({ value, label }) => (
                <label key={value} style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={form.role === value}
                    onChange={() => setForm((p) => ({ ...p, role: value }))}
                    style={styles.radio}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" style={styles.submitBtn}>가입하기</button>

          <p style={styles.notice}>
            이미 계정이 있으신가요?{' '}
            <Link to="/login" style={styles.link}>로그인</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' },
  container: { backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: '440px', overflow: 'hidden' },
  cardHeader: { backgroundColor: '#1a1a2e', color: '#fff', textAlign: 'center', padding: '36px 32px 28px' },
  iconWrapper: { fontSize: '3rem', marginBottom: '12px' },
  heading: { margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 800 },
  subheading: { margin: 0, color: '#aaa', fontSize: '0.875rem' },
  form: { padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' },
  generalError: { backgroundColor: '#fff0f0', border: '1px solid #e94560', borderRadius: '8px', padding: '12px', color: '#e94560', fontSize: '0.875rem', textAlign: 'center' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.875rem', fontWeight: 600, color: '#444' },
  input: { padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #ddd', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' },
  inputError: { borderColor: '#e94560' },
  error: { color: '#e94560', fontSize: '0.8rem', fontWeight: 500 },
  roleGroup: { display: 'flex', gap: '16px' },
  radioLabel: { display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#555' },
  radio: { accentColor: '#e94560' },
  submitBtn: { width: '100%', padding: '14px', backgroundColor: '#e94560', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginTop: '4px' },
  notice: { margin: 0, fontSize: '0.875rem', color: '#666', textAlign: 'center' },
  link: { color: '#e94560', fontWeight: 600, textDecoration: 'none' },
  successCard: { backgroundColor: '#fff', borderRadius: '20px', padding: '60px 40px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: '400px', width: '100%' },
  successIcon: { fontSize: '4rem', marginBottom: '20px' },
  successTitle: { margin: '0 0 12px', fontSize: '1.5rem', color: '#1a1a2e' },
  successMessage: { margin: '0 0 8px', color: '#333', fontSize: '1rem' },
  successSub: { color: '#aaa', fontSize: '0.875rem' },
};
