import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { paymentApi } from '../services/api';

type Phase = 'loading' | 'success' | 'error';

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshEnrollments, refreshCart } = useApp();

  const [phase, setPhase] = useState<Phase>('loading');
  const [message, setMessage] = useState<string>('Toss 결제를 승인하는 중입니다...');
  const [amount, setAmount] = useState<number | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const paymentKey = params.get('paymentKey');
    const orderId = params.get('orderId');
    const amountStr = params.get('amount');

    if (!paymentKey || !orderId || !amountStr) {
      setPhase('error');
      setMessage('결제 정보가 누락되었습니다.');
      return;
    }
    const amountNum = Number(amountStr);
    if (!Number.isFinite(amountNum)) {
      setPhase('error');
      setMessage('결제 금액이 올바르지 않습니다.');
      return;
    }

    paymentApi
      .tossConfirm(paymentKey, orderId, amountNum)
      .then(async (payment) => {
        setAmount(payment.total_amount);
        setPhase('success');
        setMessage('결제가 완료되었습니다. 수강 등록이 진행되었습니다.');
        await Promise.all([refreshEnrollments(), refreshCart()]);
      })
      .catch((err: unknown) => {
        setPhase('error');
        setMessage(err instanceof Error ? err.message : '결제 승인에 실패했습니다.');
      });
  }, [params, refreshEnrollments, refreshCart]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {phase === 'loading' && (
          <>
            <div style={styles.spinner} />
            <h2 style={styles.title}>결제 승인 중</h2>
            <p style={styles.desc}>{message}</p>
          </>
        )}
        {phase === 'success' && (
          <>
            <div style={styles.iconSuccess}>✓</div>
            <h2 style={styles.title}>결제가 완료되었습니다</h2>
            <p style={styles.desc}>{message}</p>
            {amount !== null && (
              <p style={styles.amount}>{amount.toLocaleString()}원 결제 완료</p>
            )}
            <button
              style={styles.primaryBtn}
              onClick={() => navigate('/enrollments')}
              data-testid="go-enrollments-btn"
            >
              내 수강 목록으로 이동
            </button>
          </>
        )}
        {phase === 'error' && (
          <>
            <div style={styles.iconError}>!</div>
            <h2 style={styles.title}>결제 승인 실패</h2>
            <p style={styles.desc}>{message}</p>
            <div style={styles.actions}>
              <Link to="/cart" style={styles.secondaryBtn}>장바구니로 돌아가기</Link>
              <Link to="/" style={styles.primaryBtnLink}>홈으로</Link>
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '40px 32px',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
  },
  spinner: {
    width: '40px',
    height: '40px',
    margin: '0 auto 16px',
    border: '4px solid #eee',
    borderTopColor: '#3182f6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  iconSuccess: {
    width: '64px',
    height: '64px',
    margin: '0 auto 16px',
    borderRadius: '50%',
    backgroundColor: '#dcfce7',
    color: '#15803d',
    fontSize: '2rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconError: {
    width: '64px',
    height: '64px',
    margin: '0 auto 16px',
    borderRadius: '50%',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    fontSize: '2rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { margin: '0 0 8px', fontSize: '1.4rem', color: '#1a1a2e' },
  desc: { color: '#666', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '16px' },
  amount: { fontSize: '1.2rem', fontWeight: 800, color: '#3182f6', marginBottom: '20px' },
  primaryBtn: {
    padding: '12px 28px',
    backgroundColor: '#3182f6',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
  },
  primaryBtnLink: {
    padding: '12px 28px',
    backgroundColor: '#3182f6',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '0.95rem',
    textDecoration: 'none',
  },
  secondaryBtn: {
    padding: '12px 28px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '0.95rem',
    textDecoration: 'none',
  },
  actions: { display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' },
};
