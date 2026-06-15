import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { paymentApi } from "../services/api";

const TOSS_CLIENT_KEY =
  import.meta.env.VITE_TOSS_CLIENT_KEY ??
  "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq";

export default function CheckoutPage() {
  const { cartItems, currentUser } = useApp();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div style={styles.empty}>
        <p>로그인이 필요합니다.</p>
        <Link to="/login" style={styles.actionLink}>
          로그인하기
        </Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div style={styles.empty}>
        <p>장바구니가 비어 있습니다.</p>
        <Link to="/" style={styles.actionLink}>
          강의 담으러 가기
        </Link>
      </div>
    );
  }

  const total = cartItems.reduce(
    (sum, item) => sum + (item.course?.price ?? 0),
    0,
  );
  const courseIds = cartItems.map((item) => item.course_id);

  const handlePay = async () => {
    setError(null);
    if (!window.TossPayments) {
      setError(
        "Toss 결제 모듈을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.",
      );
      return;
    }

    setLoading(true);
    try {
      const prep = await paymentApi.tossPrepare(courseIds);
      const tossPayments = window.TossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({
        customerKey: `user_${currentUser.id}`,
      });
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: prep.amount },
        orderId: prep.orderId,
        orderName: prep.orderName,
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
      });
      // 위 호출이 성공하면 페이지가 Toss 결제창으로 이동합니다.
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "결제 요청에 실패했습니다.";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <Link to="/cart" style={styles.back}>
            ← 장바구니로 돌아가기
          </Link>
          <h1 style={styles.title}>결제</h1>
        </div>

        <div style={styles.layout}>
          <div style={styles.formSection}>
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Toss Payments 결제</h2>
              {error && (
                <div style={styles.errorBox} data-testid="checkout-error">
                  {error}
                </div>
              )}
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
                          "https://placehold.co/60x40/cccccc/666?text=No+Image";
                      }}
                    />
                    <div style={styles.courseInfo}>
                      <p style={styles.courseTitle}>{item.course?.title}</p>
                      <p style={styles.courseInstructor}>
                        {item.course?.instructor}
                      </p>
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
                <span style={styles.totalAmount}>
                  {total.toLocaleString()}원
                </span>
              </div>

              <button
                onClick={handlePay}
                disabled={loading}
                style={{
                  ...styles.payBtn,
                  ...(loading ? styles.payBtnDisabled : {}),
                }}
                data-testid="toss-pay-btn"
              >
                {loading
                  ? "결제 처리 중..."
                  : `${total.toLocaleString()}원 결제하기`}
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
    minHeight: "100vh",
    backgroundColor: "#f8f9fa",
    paddingBottom: "60px",
  },
  container: { maxWidth: "960px", margin: "0 auto", padding: "32px 20px" },
  header: { marginBottom: "24px" },
  back: {
    color: "#e94560",
    textDecoration: "none",
    fontSize: "0.875rem",
    display: "block",
    marginBottom: "12px",
  },
  title: { margin: 0, fontSize: "1.8rem", fontWeight: 800, color: "#1a1a2e" },
  layout: {
    display: "flex",
    gap: "28px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  formSection: { flex: "1 1 0", minWidth: "280px" },
  summarySection: { width: "320px", flexShrink: 0 },
  card: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    padding: "24px",
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#1a1a2e",
  },
  guideText: {
    color: "#555",
    fontSize: "0.92rem",
    lineHeight: 1.6,
    marginBottom: "16px",
  },
  guideList: {
    color: "#666",
    fontSize: "0.85rem",
    lineHeight: 1.8,
    paddingLeft: "20px",
    margin: 0,
  },
  errorBox: {
    marginTop: "16px",
    padding: "12px 14px",
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "8px",
    fontSize: "0.88rem",
  },
  courseList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "16px",
  },
  courseRow: { display: "flex", alignItems: "center", gap: "12px" },
  thumb: {
    width: "60px",
    height: "40px",
    objectFit: "cover",
    borderRadius: "6px",
    flexShrink: 0,
  },
  courseInfo: { flex: 1, minWidth: 0 },
  courseTitle: {
    margin: 0,
    fontSize: "0.87rem",
    fontWeight: 600,
    color: "#1a1a2e",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  courseInstructor: { margin: 0, fontSize: "0.75rem", color: "#888" },
  coursePrice: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#e94560",
    flexShrink: 0,
  },
  divider: { border: "none", borderTop: "1px solid #eee", margin: "16px 0" },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  totalLabel: { fontSize: "1rem", fontWeight: 600, color: "#333" },
  totalAmount: { fontSize: "1.3rem", fontWeight: 800, color: "#e94560" },
  payBtn: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#3182f6",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  payBtnDisabled: { backgroundColor: "#ccc", cursor: "not-allowed" },
  empty: { textAlign: "center", padding: "80px 20px", color: "#666" },
  actionLink: {
    display: "inline-block",
    backgroundColor: "#e94560",
    color: "#fff",
    padding: "10px 24px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: 600,
    marginTop: "16px",
  },
};
