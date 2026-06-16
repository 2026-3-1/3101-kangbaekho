import { ReactNode } from 'react';
import { Link, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const NAV: { to: string; label: string; icon: string }[] = [
  { to: '/admin', label: '대시보드', icon: '📊' },
  { to: '/admin/users', label: '사용자 관리', icon: '👥' },
  { to: '/admin/payments', label: '결제 내역', icon: '💳' },
  { to: '/admin/logs', label: '운영 로그', icon: '📋' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();

  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'admin') {
    return (
      <div style={styles.deniedPage}>
        <div style={styles.deniedCard}>
          <div style={{ fontSize: '3rem' }}>🚫</div>
          <h1 style={{ margin: '12px 0 4px' }}>관리자 전용 페이지입니다</h1>
          <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
            관리자 계정으로 로그인하면 접근할 수 있습니다.
          </p>
          <Link to="/" style={styles.homeBtn}>일반 사이트로 돌아가기</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <span style={styles.brandIcon}>⚙️</span>
          <div>
            <div style={styles.brandTitle}>관리자 콘솔</div>
            <div style={styles.brandSub}>OU Admin</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userBox}>
            <div style={styles.userName}>{currentUser.name}</div>
            <div style={styles.userEmail}>{currentUser.email}</div>
          </div>
          <Link to="/" style={styles.exitBtn}>← 일반 사이트로</Link>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            style={styles.logoutBtn}
          >
            로그아웃
          </button>
        </div>
      </aside>

      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a' },
  sidebar: {
    width: '240px',
    flexShrink: 0,
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
    borderRight: '1px solid #334155',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 20px 20px',
    borderBottom: '1px solid #334155',
    marginBottom: '12px',
  },
  brandIcon: {
    fontSize: '1.6rem',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: { fontWeight: 800, fontSize: '0.95rem' },
  brandSub: { fontSize: '0.72rem', color: '#94a3b8' },
  nav: { display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 12px', flex: 1 },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#cbd5e1',
    fontSize: '0.92rem',
    fontWeight: 600,
  },
  navLinkActive: { backgroundColor: '#3b82f6', color: '#fff' },
  navIcon: { fontSize: '1rem', width: '20px', textAlign: 'center' as const },
  sidebarFooter: {
    padding: '0 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    borderTop: '1px solid #334155',
    paddingTop: '16px',
  },
  userBox: { marginBottom: '6px' },
  userName: { fontWeight: 700, fontSize: '0.88rem' },
  userEmail: { color: '#94a3b8', fontSize: '0.72rem' },
  exitBtn: {
    display: 'block',
    textAlign: 'center' as const,
    backgroundColor: '#334155',
    color: '#cbd5e1',
    padding: '8px 12px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '0.82rem',
    fontWeight: 600,
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #475569',
    color: '#cbd5e1',
    padding: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: 600,
  },
  main: { flex: 1, padding: '32px', backgroundColor: '#0f172a', color: '#e2e8f0', overflow: 'auto' },
  deniedPage: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  deniedCard: {
    backgroundColor: '#fff',
    padding: '40px 32px',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    textAlign: 'center' as const,
    maxWidth: '480px',
  },
  homeBtn: {
    padding: '12px 28px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    borderRadius: '10px',
    fontWeight: 700,
    textDecoration: 'none',
  },
};
