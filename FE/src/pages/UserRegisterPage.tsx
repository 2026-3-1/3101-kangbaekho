import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function UserRegisterPage() {
  const navigate = useNavigate();
  const { addUser, setCurrentUser } = useApp();

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'student',
  });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: { name?: string; email?: string } = {};
    if (!form.name.trim()) newErrors.name = '이름을 입력해주세요.';
    if (!form.email.trim()) newErrors.email = '이메일을 입력해주세요.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = '유효한 이메일 형식이 아닙니다.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const newUser = addUser(form.name, form.email, form.role);
    setSuccess(true);

    setTimeout(() => {
      setCurrentUser(newUser);
      navigate('/');
    }, 2000);
  };

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>🎉</div>
          <h2 style={styles.successTitle}>회원 가입 완료!</h2>
          <p style={styles.successMessage}>
            <strong>{form.name}</strong>님, 환영합니다!
          </p>
          <p style={styles.successSub}>
            잠시 후 강의 목록으로 이동합니다...
          </p>
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
          <p style={styles.subheading}>
            온라인 강의 플랫폼에 오신 것을 환영합니다
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>이름 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm((p) => ({ ...p, name: e.target.value }));
                if (errors.name)
                  setErrors((p) => ({ ...p, name: undefined }));
              }}
              placeholder="홍길동"
              style={{
                ...styles.input,
                ...(errors.name ? styles.inputError : {}),
              }}
            />
            {errors.name && (
              <span style={styles.error}>{errors.name}</span>
            )}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>이메일 *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm((p) => ({ ...p, email: e.target.value }));
                if (errors.email)
                  setErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="example@email.com"
              style={{
                ...styles.input,
                ...(errors.email ? styles.inputError : {}),
              }}
            />
            {errors.email && (
              <span style={styles.error}>{errors.email}</span>
            )}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>역할</label>
            <div style={styles.roleGroup}>
              {['student', 'instructor', 'admin'].map((role) => (
                <label key={role} style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={form.role === role}
                    onChange={() => setForm((p) => ({ ...p, role }))}
                    style={styles.radio}
                  />
                  <span>
                    {role === 'student'
                      ? '학생'
                      : role === 'instructor'
                      ? '강사'
                      : '관리자'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" style={styles.submitBtn}>
            가입하기
          </button>

          <p style={styles.notice}>
            * 가입 후 해당 계정으로 자동 로그인됩니다.
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
  iconWrapper: {
    fontSize: '3rem',
    marginBottom: '12px',
  },
  heading: {
    margin: '0 0 8px',
    fontSize: '1.5rem',
    fontWeight: 800,
  },
  subheading: {
    margin: 0,
    color: '#aaa',
    fontSize: '0.875rem',
  },
  form: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#444',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1.5px solid #ddd',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#e94560',
  },
  error: {
    color: '#e94560',
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  roleGroup: {
    display: 'flex',
    gap: '16px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#555',
  },
  radio: {
    accentColor: '#e94560',
  },
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
    marginTop: '4px',
  },
  notice: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#aaa',
    textAlign: 'center',
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '60px 40px',
    textAlign: 'center',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    maxWidth: '400px',
    width: '100%',
  },
  successIcon: {
    fontSize: '4rem',
    marginBottom: '20px',
  },
  successTitle: {
    margin: '0 0 12px',
    fontSize: '1.5rem',
    color: '#1a1a2e',
  },
  successMessage: {
    margin: '0 0 8px',
    color: '#333',
    fontSize: '1rem',
  },
  successSub: {
    color: '#aaa',
    fontSize: '0.875rem',
  },
};
