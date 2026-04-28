import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, currentUser, checkout } = useApp();

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [loading, setLoading] = useState(false);

  if (!currentUser) {
    return (
      <div style={styles.empty}>
        <p>로그인이 필요합니다.</p>
        <Link to="/login" style={styles.actionLink}>로그인하기</Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div style={styles.empty}>
        <p>장바구니가 비어 있습니다.</p>
        <Link to="/" style={styles.actionLink}>강의 담으러 가기</Link>
      </div>
    );
  }

  const total = cartItems.reduce((sum, item) => sum + (item.course?.price ?? 0), 0);
  const courseIds = cartItems.map((item) => item.course_id);

  const formatCard = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const isFormValid =
    cardNumber.replace(/\s/g, '').length === 16 &&
    expiry.length === 5 &&
    cvc.length >= 3;

  const handlePay = async () => {
    if (!isFormValid) {
      alert('카드 정보를 올바르게 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await checkout(courseIds);
      alert(`결제가 완료되었습니다!\n총 ${total.toLocaleString()}원이 결제되었습니다.`);
      navigate('/enrollments');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '결제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <Link to="/cart" style={styles.back}>← 장바구니로 돌아가기</Link>
          <h1 style={styles.title}>결제</h1>
        </div>

        <div style={styles.layout}>
          <div style={styles.formSection}>
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>결제 수단</h2>
              <div style={styles.field}>
                <label style={styles.label}>카드 번호</label>
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCard(e.target.value))}
                  style={styles.input}
                  maxLength={19}
                />
              </div>
              <div style={styles.fieldRow}>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label}>유효기간</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    style={styles.input}
                    maxLength={5}
                  />
                </div>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label}>CVC</label>
                  <input
                    type="text"
                    placeholder="000"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    style={styles.input}
                    maxLength={4}
                  />
                </div>
              </div>
              <p style={styles.notice}>※ 이 결제는 모의 결제입니다. 실제 결제가 이루어지지 않습니다.</p>
            </div>
          </div>

          <div style={styles.summarySection}>
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>주문 요약</h2>
              <div style={styles.courseList}>
                {cartItems.map((item) => (
                  <div key={item.id} style={styles.courseRow}>
                    <img
                      src={item.course?.thumbnail_url}
                      alt={item.course?.title}
                      style={styles.thumb}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://placehold.co/60x40/cccccc/666?text=No+Image';
                      }}
                    />
                    <div style={styles.courseInfo}>
                      <p style={styles.courseTitle}>{item.course?.title}</p>
                      <p style={styles.courseInstructor}>{item.course?.instructor}</p>
                    </div>
                    <span style={styles.coursePrice}>
                      {(item.course?.price ?? 0).toLocaleString()}원
                    </span>
                  </div>
                ))}
              </div>

              <hr style={styles.divider} />

              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>총 결제 금액</span>
                <span style={styles.totalAmount}>{total.toLocaleString()}원</span>
              </div>

              <button
                onClick={handlePay}
                disabled={loading || !isFormValid}
                style={{
                  ...styles.payBtn,
                  ...(loading || !isFormValid ? styles.payBtnDisabled : {}),
                }}
              >
                {loading ? '결제 처리 중...' : `${total.toLocaleString()}원 결제하기`}
              </button>
            </div>
          </div>
        </div>
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
    maxWidth: '960px',
    margin: '0 auto',
    padding: '32px 20px',
  },
  header: {
    marginBottom: '24px',
  },
  back: {
    color: '#e94560',
    textDecoration: 'none',
    fontSize: '0.875rem',
    display: 'block',
    marginBottom: '12px',
  },
  title: {
    margin: 0,
    fontSize: '1.8rem',
    fontWeight: 800,
    color: '#1a1a2e',
  },
  layout: {
    display: 'flex',
    gap: '28px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  formSection: {
    flex: '1 1 0',
    minWidth: '280px',
  },
  summarySection: {
    width: '320px',
    flexShrink: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    padding: '24px',
  },
  sectionTitle: {
    margin: '0 0 20px',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#1a1a2e',
  },
  field: {
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldRow: {
    display: 'flex',
    gap: '12px',
  },
  label: {
    fontSize: '0.83rem',
    fontWeight: 600,
    color: '#555',
  },
  input: {
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1.5px solid #ddd',
    fontSize: '1rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  notice: {
    fontSize: '0.78rem',
    color: '#aaa',
    marginTop: '8px',
  },
  courseList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  },
  courseRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  thumb: {
    width: '60px',
    height: '40px',
    objectFit: 'cover',
    borderRadius: '6px',
    flexShrink: 0,
  },
  courseInfo: {
    flex: 1,
    minWidth: 0,
  },
  courseTitle: {
    margin: 0,
    fontSize: '0.87rem',
    fontWeight: 600,
    color: '#1a1a2e',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  courseInstructor: {
    margin: 0,
    fontSize: '0.75rem',
    color: '#888',
  },
  coursePrice: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#e94560',
    flexShrink: 0,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #eee',
    margin: '16px 0',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  totalLabel: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#333',
  },
  totalAmount: {
    fontSize: '1.3rem',
    fontWeight: 800,
    color: '#e94560',
  },
  payBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  payBtnDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  empty: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#666',
  },
  actionLink: {
    display: 'inline-block',
    backgroundColor: '#e94560',
    color: '#fff',
    padding: '10px 24px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    marginTop: '16px',
  },
};
