import { useEffect, useState } from 'react';
import { adminApi, AdminUser } from '../services/api';

const ROLES: ('student' | 'instructor' | 'admin')[] = ['student', 'instructor', 'admin'];

export default function AdminUsersPage() {
  const [data, setData] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = (overrides?: { page?: number; q?: string; role?: string }) => {
    const params = {
      page: overrides?.page ?? page,
      limit,
      q: overrides?.q ?? q,
      role: overrides?.role ?? role,
    };
    adminApi
      .users(params)
      .then((res) => {
        setData(res.data);
        setTotal(res.total);
        setPage(res.page);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : '로드 실패'));
  };

  useEffect(() => {
    load({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRoleChange = async (user: AdminUser, next: 'student' | 'instructor' | 'admin') => {
    if (user.role === next) return;
    if (!window.confirm(`${user.email}님의 권한을 '${next}'로 변경하시겠습니까?`)) return;
    try {
      await adminApi.updateUserRole(user.id, next);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '권한 변경 실패');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <header style={styles.header}>
        <h1 style={styles.title}>사용자 관리</h1>
        <p style={styles.subtitle}>총 {total}명</p>
      </header>

      <div style={styles.filters}>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이메일 또는 이름 검색"
          style={styles.input}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.select}>
          <option value="">전체 권한</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button onClick={() => load({ page: 1 })} style={styles.searchBtn} data-testid="admin-users-search">
          검색
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>이름</th>
              <th style={styles.th}>이메일</th>
              <th style={styles.th}>가입일</th>
              <th style={styles.th}>권한</th>
              <th style={styles.th}>권한 변경</th>
            </tr>
          </thead>
          <tbody>
            {data.map((u) => (
              <tr key={u.id} style={styles.tr} data-testid={`admin-user-${u.id}`}>
                <td style={styles.td}>{u.id}</td>
                <td style={styles.td}>{u.name}</td>
                <td style={styles.td}>{u.email}</td>
                <td style={styles.td}>{new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.roleBadge, ...badgeStyle(u.role) }}>{u.role}</span>
                </td>
                <td style={styles.td}>
                  <select
                    value={u.role}
                    onChange={(e) => onRoleChange(u, e.target.value as 'student' | 'instructor' | 'admin')}
                    style={styles.roleSelect}
                    data-testid={`role-select-${u.id}`}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
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
        <span style={{ color: '#cbd5e1' }}>{page} / {totalPages}</span>
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

function badgeStyle(role: string): React.CSSProperties {
  if (role === 'admin') return { backgroundColor: '#7f1d1d', color: '#fecaca' };
  if (role === 'instructor') return { backgroundColor: '#78350f', color: '#fde68a' };
  return { backgroundColor: '#1e3a8a', color: '#bfdbfe' };
}

const styles: Record<string, React.CSSProperties> = {
  header: { marginBottom: '20px' },
  title: { margin: 0, fontSize: '1.4rem', color: '#f1f5f9' },
  subtitle: { margin: '4px 0 0', color: '#94a3b8', fontSize: '0.88rem' },
  filters: { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' },
  input: {
    flex: 1,
    minWidth: '200px',
    padding: '8px 12px',
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    border: '1px solid #334155',
    borderRadius: '8px',
    outline: 'none',
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
  error: {
    backgroundColor: '#7f1d1d',
    color: '#fecaca',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  tableWrap: { backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#0f172a' },
  th: { padding: '12px 16px', textAlign: 'left' as const, color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700 },
  tr: { borderBottom: '1px solid #334155' },
  td: { padding: '14px 16px', fontSize: '0.88rem', color: '#e2e8f0' },
  roleBadge: { padding: '4px 10px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 700 },
  roleSelect: {
    padding: '6px 10px',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    border: '1px solid #334155',
    borderRadius: '6px',
  },
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
