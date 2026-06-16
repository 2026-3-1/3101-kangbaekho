import { useEffect, useState } from 'react';
import { adminApi, AdminPaymentRow } from '../services/api';

const STATUSES = ['', 'completed', 'pending', 'failed'];

export default function AdminPaymentsPage() {
  const [rows, setRows] = useState<AdminPaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = (overrides?: { page?: number; status?: string }) => {
    adminApi
      .payments({
        page: overrides?.page ?? page,
        limit,
        status: overrides?.status ?? status,
      })
      .then((res) => {
        setRows(res.data);
        setTotal(res.total);
        setPage(res.page);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : '로드 실패'),
      );
  };

  useEffect(() => {
    load({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <header style={styles.header}>
        <h1 style={styles.title}>결제 내역</h1>
        <p style={styles.subtitle}>총 {total}건</p>
      </header>

      <div style={styles.filters}>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            load({ page: 1, status: e.target.value });
          }}
          style={styles.select}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === '' ? '전체 상태' : s}
            </option>
          ))}
        </select>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>주문 ID</th>
              <th style={styles.th}>사용자 ID</th>
              <th style={styles.th}>금액</th>
              <th style={styles.th}>방법</th>
              <th style={styles.th}>상태</th>
              <th style={styles.th}>결제일</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} style={styles.tr}>
                <td style={styles.td}>{p.id}</td>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {p.order_id ?? '-'}
                </td>
                <td style={styles.td}>{p.user_id}</td>
                <td style={styles.td}>{p.total_amount.toLocaleString()}원</td>
                <td style={styles.td}>{p.method ?? '-'}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.statusBadge, ...statusStyle(p.status) }}>
                    {p.status}
                  </span>
                </td>
                <td style={styles.td}>
                  {new Date(p.created_at).toLocaleString('ko-KR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.pagination}>
        <button
          disabled={page <= 1}
          onClick={() => load({ page: page - 1 })}
          style={styles.pageBtn}
        >
          ← 이전
        </button>
        <span style={{ color: '#cbd5e1' }}>
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => load({ page: page + 1 })}
          style={styles.pageBtn}
        >
          다음 →
        </button>
      </div>
    </div>
  );
}

function statusStyle(s: string): React.CSSProperties {
  if (s === 'completed') return { backgroundColor: '#14532d', color: '#bbf7d0' };
  if (s === 'pending') return { backgroundColor: '#78350f', color: '#fde68a' };
  return { backgroundColor: '#7f1d1d', color: '#fecaca' };
}

const styles: Record<string, React.CSSProperties> = {
  header: { marginBottom: '20px' },
  title: { margin: 0, fontSize: '1.4rem', color: '#f1f5f9' },
  subtitle: { margin: '4px 0 0', color: '#94a3b8', fontSize: '0.88rem' },
  filters: { display: 'flex', gap: '10px', marginBottom: '16px' },
  select: {
    padding: '8px 12px',
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    border: '1px solid #334155',
    borderRadius: '8px',
  },
  error: {
    backgroundColor: '#7f1d1d',
    color: '#fecaca',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  tableWrap: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    overflow: 'auto',
    border: '1px solid #334155',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#0f172a' },
  th: {
    padding: '12px 16px',
    textAlign: 'left' as const,
    color: '#94a3b8',
    fontSize: '0.78rem',
    fontWeight: 700,
  },
  tr: { borderBottom: '1px solid #334155' },
  td: { padding: '14px 16px', fontSize: '0.88rem', color: '#e2e8f0' },
  statusBadge: { padding: '4px 10px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 700 },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '16px',
  },
  pageBtn: {
    padding: '8px 14px',
    backgroundColor: '#1e293b',
    color: '#cbd5e1',
    border: '1px solid #334155',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
  },
};
