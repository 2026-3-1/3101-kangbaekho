import { useEffect, useState } from 'react';
import { adminApi, AdminAuditLog } from '../services/api';

export default function AdminLogsPage() {
  const [rows, setRows] = useState<AdminAuditLog[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = (overrides?: {
    page?: number;
    action?: string;
    from?: string;
    to?: string;
  }) => {
    adminApi
      .logs({
        page: overrides?.page ?? page,
        limit,
        action: overrides?.action ?? action,
        from: overrides?.from ?? from,
        to: overrides?.to ?? to,
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
    adminApi.logActions().then(setActions).catch(() => {});
    load({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <header style={styles.header}>
        <h1 style={styles.title}>운영 로그</h1>
        <p style={styles.subtitle}>
          주요 운영 액션 기록 — 총 {total}건
        </p>
      </header>

      <div style={styles.filters}>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          style={styles.select}
          data-testid="logs-action-filter"
        >
          <option value="">전체 액션</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          style={styles.input}
          title="시작일"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          style={styles.input}
          title="종료일"
        />
        <button
          onClick={() => load({ page: 1 })}
          style={styles.searchBtn}
          data-testid="logs-search-btn"
        >
          조회
        </button>
        <button
          onClick={() => {
            setAction('');
            setFrom('');
            setTo('');
            load({ page: 1, action: '', from: '', to: '' });
          }}
          style={styles.clearBtn}
        >
          초기화
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>시간</th>
              <th style={styles.th}>액션</th>
              <th style={styles.th}>주체</th>
              <th style={styles.th}>대상</th>
              <th style={styles.th}>상세</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((log) => (
              <tr key={log.id} style={styles.tr}>
                <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>
                  {new Date(log.created_at).toLocaleString('ko-KR')}
                </td>
                <td style={styles.td}>
                  <span style={styles.actionBadge}>{log.action}</span>
                </td>
                <td style={styles.td}>
                  {log.actor_id != null ? (
                    <>
                      <span style={styles.actorRole}>{log.actor_role ?? '?'}</span>
                      <span> #{log.actor_id}</span>
                    </>
                  ) : (
                    <span style={{ color: '#64748b' }}>시스템</span>
                  )}
                </td>
                <td style={styles.td}>
                  {log.target_type && (
                    <>
                      {log.target_type}
                      {log.target_id != null ? ` #${log.target_id}` : ''}
                    </>
                  )}
                </td>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '0.78rem' }}>
                  {log.detail ?? ''}
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

const styles: Record<string, React.CSSProperties> = {
  header: { marginBottom: '20px' },
  title: { margin: 0, fontSize: '1.4rem', color: '#f1f5f9' },
  subtitle: { margin: '4px 0 0', color: '#94a3b8', fontSize: '0.88rem' },
  filters: { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' },
  input: {
    padding: '8px 12px',
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    border: '1px solid #334155',
    borderRadius: '8px',
    outline: 'none',
    colorScheme: 'dark',
  },
  select: {
    padding: '8px 12px',
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    border: '1px solid #334155',
    borderRadius: '8px',
  },
  searchBtn: {
    padding: '8px 18px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  clearBtn: {
    padding: '8px 14px',
    backgroundColor: '#334155',
    color: '#cbd5e1',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
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
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  thead: { backgroundColor: '#0f172a' },
  th: {
    padding: '12px 16px',
    textAlign: 'left' as const,
    color: '#94a3b8',
    fontSize: '0.78rem',
    fontWeight: 700,
  },
  tr: { borderBottom: '1px solid #334155' },
  td: { padding: '12px 16px', fontSize: '0.85rem', color: '#e2e8f0', verticalAlign: 'top' as const },
  actionBadge: {
    backgroundColor: '#1e3a8a',
    color: '#bfdbfe',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '0.74rem',
    fontWeight: 700,
    fontFamily: 'monospace',
  },
  actorRole: { color: '#fde68a', fontSize: '0.78rem', marginRight: '4px' },
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
