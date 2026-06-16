import { useEffect, useState } from 'react';
import { adminApi, AdminStats } from '../services/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.stats().then(setStats).catch((e: unknown) => {
      setError(e instanceof Error ? e.message : '통계 로드 실패');
    });
  }, []);

  return (
    <div>
      <header style={styles.header}>
        <h1 style={styles.title}>대시보드</h1>
        <p style={styles.subtitle}>플랫폼 운영 현황을 한눈에 확인합니다.</p>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      {!stats ? (
        <div style={styles.loading}>불러오는 중...</div>
      ) : (
        <>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>사용자</h2>
            <div style={styles.cardGrid}>
              <StatCard label="총 사용자" value={stats.users.total} accent="#3b82f6" />
              <StatCard label="학생" value={stats.users.student} accent="#22c55e" />
              <StatCard label="강사" value={stats.users.instructor} accent="#f59e0b" />
              <StatCard label="관리자" value={stats.users.admin} accent="#ef4444" />
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>학습</h2>
            <div style={styles.cardGrid}>
              <StatCard label="총 강의" value={stats.courses.total} accent="#3b82f6" />
              <StatCard label="총 수강" value={stats.enrollments.total} accent="#8b5cf6" />
              <StatCard label="완료된 수강" value={stats.enrollments.completed} accent="#22c55e" />
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>매출</h2>
            <div style={styles.cardGrid}>
              <StatCard label="완료 결제 수" value={stats.payments.total_completed} accent="#3b82f6" />
              <StatCard
                label="누적 매출"
                value={`${stats.payments.revenue.toLocaleString()}원`}
                accent="#22c55e"
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div style={{ ...styles.card, borderLeft: `4px solid ${accent}` }}>
      <div style={styles.cardLabel}>{label}</div>
      <div style={styles.cardValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { marginBottom: '24px' },
  title: { margin: 0, fontSize: '1.6rem', color: '#f8fafc' },
  subtitle: { margin: '4px 0 0', color: '#94a3b8', fontSize: '0.92rem' },
  section: { marginBottom: '32px' },
  sectionTitle: { margin: '0 0 12px', fontSize: '1rem', color: '#cbd5e1', fontWeight: 700 },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' },
  card: {
    backgroundColor: '#1e293b',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #334155',
  },
  cardLabel: { color: '#94a3b8', fontSize: '0.82rem', marginBottom: '8px' },
  cardValue: { color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 800 },
  loading: { color: '#94a3b8' },
  error: {
    backgroundColor: '#7f1d1d',
    color: '#fecaca',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
};
