import { Link, useSearchParams } from 'react-router-dom';

export default function PaymentFailPage() {
  const [params] = useSearchParams();
  const code = params.get('code') ?? 'UNKNOWN';
  const message = params.get('message') ?? '결제가 정상적으로 처리되지 않았습니다.';
  const orderId = params.get('orderId');

  return (
    <div style={styles.page}>
      <div style={styles.card} data-testid="payment-fail-card">
        <div style={styles.icon}>!</div>
        <h2 style={styles.title}>결제 실패</h2>
        <p style={styles.desc}>{message}</p>
        <div style={styles.meta}>
          <div>
            <span style={styles.metaLabel}>오류 코드</span>
            <span style={styles.metaValue}>{code}</span>
          </div>
          {orderId && (
            <div>
              <span style={styles.metaLabel}>주문 ID</span>
              <span style={styles.metaValue}>{orderId}</span>
            </div>
          )}
        </div>
        <div style={styles.actions}>
          <Link to="/cart" style={styles.secondaryBtn}>장바구니로 돌아가기</Link>
          <Link to="/checkout" style={styles.primaryBtn}>다시 결제하기</Link>
        </div>
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
  icon: {
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
  meta: {
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '0.85rem',
    color: '#444',
    textAlign: 'left',
  },
  metaLabel: { display: 'inline-block', width: '80px', color: '#999', fontWeight: 600 },
  metaValue: { fontWeight: 600, color: '#1a1a2e' },
  actions: { display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' },
  primaryBtn: {
    padding: '12px 28px',
    backgroundColor: '#3182f6',
    color: '#fff',
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
};
