import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const location = useLocation();
  const { currentUser } = useApp();

  const navLinks = [
    { to: '/', label: '강의 목록' },
    { to: '/enrollments', label: '내 수강 목록' },
    { to: '/courses/new', label: '강의 등록' },
    { to: '/users/register', label: '회원 가입' },
  ];

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.brand}>
          📚 온라인 강의 플랫폼
        </Link>
        <div style={styles.links}>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                ...styles.link,
                ...(location.pathname === link.to ? styles.activeLink : {}),
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div style={styles.userInfo}>
          <span style={styles.userBadge}>
            {currentUser
              ? `${currentUser.role === 'admin' ? '👑' : '👤'} ${currentUser.name}`
              : '👤 게스트'}
          </span>
        </div>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    backgroundColor: '#1a1a2e',
    borderBottom: '2px solid #e94560',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px',
  },
  brand: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '1.2rem',
    fontWeight: 700,
  },
  links: {
    display: 'flex',
    gap: '8px',
  },
  link: {
    color: '#ccc',
    textDecoration: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    transition: 'background 0.2s',
  },
  activeLink: {
    color: '#fff',
    backgroundColor: '#e94560',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
  },
  userBadge: {
    color: '#aaa',
    fontSize: '0.85rem',
    backgroundColor: '#16213e',
    padding: '4px 12px',
    borderRadius: '20px',
    border: '1px solid #333',
  },
};
