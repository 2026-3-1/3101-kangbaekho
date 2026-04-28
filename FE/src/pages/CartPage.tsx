import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function CartPage() {
  const navigate = useNavigate();
  const { cartItems, currentUser, enrollments, removeFromCart, clearCart } = useApp();

  if (!currentUser) {
    return (
      <div style={styles.empty}>
        <p>로그인이 필요합니다.</p>
        <Link to="/login" style={styles.actionLink}>로그인하기</Link>
      </div>
    );
  }

  const total = cartItems.reduce((sum, item) => sum + (item.course?.price ?? 0), 0);

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    navigate('/checkout');
  };

  const handleRemove = async (itemId: number) => {
    try {
      await removeFromCart(itemId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('장바구니를 모두 비우시겠습니까?')) return;
    try {
      await clearCart();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '초기화에 실패했습니다.');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>장바구니</h1>
          <span style={styles.count}>{cartItems.length}개 강의</span>
        </div>

        {cartItems.length === 0 ? (
          <div style={styles.emptyCart}>
            <div style={styles.emptyIcon}>🛒</div>
            <p style={styles.emptyText}>장바구니가 비어 있습니다.</p>
            <Link to="/" style={styles.actionLink}>강의 둘러보기</Link>
          </div>
        ) : (
          <div style={styles.layout}>
            <div style={styles.itemList}>
              {cartItems.map((item) => {
                const course = item.course;
                const isEnrolled = enrollments.some((e) => e.course_id === item.course_id);
                return (
                  <div key={item.id} style={styles.card}>
                    <img
                      src={course?.thumbnail_url}
                      alt={course?.title}
                      style={styles.thumbnail}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://placehold.co/120x80/cccccc/666?text=No+Image';
                      }}
                    />
                    <div style={styles.cardBody}>
                      <div style={styles.cardTop}>
                        <span style={styles.categoryBadge}>{course?.category}</span>
                        {isEnrolled && (
                          <span style={styles.enrolledBadge}>✓ 이미 수강 중</span>
                        )}
                      </div>
                      <Link to={`/courses/${item.course_id}`} style={styles.courseTitle}>
                        {course?.title}
                      </Link>
                      <p style={styles.instructor}>강사: {course?.instructor}</p>
                    </div>
                    <div style={styles.cardRight}>
                      <span style={styles.price}>{(course?.price ?? 0).toLocaleString()}원</span>
                      <button
                        onClick={() => handleRemove(item.id)}
                        style={styles.removeBtn}
                        title="장바구니에서 제거"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}

              <button onClick={handleClearAll} style={styles.clearBtn}>
                장바구니 비우기
              </button>
            </div>

            <div style={styles.summary}>
              <div style={styles.summaryCard}>
                <h2 style={styles.summaryTitle}>결제 요약</h2>
                <div style={styles.summaryRow}>
                  <span>강의 수</span>
                  <span>{cartItems.length}개</span>
                </div>
                <div style={styles.summaryRow}>
                  <span>총 금액</span>
                  <span style={styles.totalPrice}>{total.toLocaleString()}원</span>
                </div>
                <hr style={styles.divider} />
                <button onClick={handleCheckout} style={styles.enrollAllBtn}>
                  결제하기
                </button>
                <Link to="/" style={styles.continueLink}>
                  강의 더 담기
                </Link>
              </div>
            </div>
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
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '32px 20px',
  },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    marginBottom: '28px',
  },
  title: {
    margin: 0,
    fontSize: '1.8rem',
    fontWeight: 800,
    color: '#1a1a2e',
  },
  count: {
    fontSize: '1rem',
    color: '#888',
  },
  empty: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#666',
  },
  emptyCart: {
    textAlign: 'center',
    padding: '80px 20px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '1.1rem',
    color: '#666',
    marginBottom: '20px',
  },
  actionLink: {
    display: 'inline-block',
    backgroundColor: '#e94560',
    color: '#fff',
    padding: '10px 24px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
  },
  layout: {
    display: 'flex',
    gap: '28px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  itemList: {
    flex: '1 1 0',
    minWidth: '300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    padding: '16px',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  thumbnail: {
    width: '120px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  cardTop: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: '#e94560',
    color: '#fff',
    fontSize: '0.72rem',
    padding: '2px 10px',
    borderRadius: '20px',
    fontWeight: 600,
  },
  enrolledBadge: {
    backgroundColor: '#22c55e',
    color: '#fff',
    fontSize: '0.72rem',
    padding: '2px 10px',
    borderRadius: '20px',
    fontWeight: 600,
  },
  courseTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#1a1a2e',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  instructor: {
    margin: 0,
    fontSize: '0.83rem',
    color: '#777',
  },
  cardRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
    flexShrink: 0,
  },
  price: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#e94560',
  },
  removeBtn: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    cursor: 'pointer',
    color: '#999',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    alignSelf: 'flex-start',
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '8px 16px',
    color: '#888',
    fontSize: '0.85rem',
    cursor: 'pointer',
    marginTop: '4px',
  },
  summary: {
    width: '280px',
    flexShrink: 0,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    padding: '24px',
    position: 'sticky',
    top: '80px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  summaryTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#1a1a2e',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.95rem',
    color: '#555',
  },
  totalPrice: {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: '#e94560',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #eee',
    margin: '4px 0',
  },
  enrollAllBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  continueLink: {
    display: 'block',
    textAlign: 'center',
    color: '#666',
    fontSize: '0.87rem',
    textDecoration: 'none',
    padding: '8px',
  },
};
