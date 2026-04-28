import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, cartItems } = useApp();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = (role: string) => {
    if (role === 'admin') return '👑 관리자';
    if (role === 'instructor') return '🎓 강사';
    return '👤 학생';
  };

  const canUseCart =
    currentUser && (currentUser.role === 'student' || currentUser.role === 'admin');

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.brand}>📚 온라인 강의 플랫폼</Link>

        <div style={styles.links}>
          <Link to="/" style={{ ...styles.link, ...(location.pathname === '/' ? styles.activeLink : {}) }}>
            강의 목록
          </Link>

          {currentUser && (
            <Link
              to="/enrollments"
              style={{ ...styles.link, ...(location.pathname === '/enrollments' ? styles.activeLink : {}) }}
            >
              내 수강 목록
            </Link>
          )}

          {currentUser && (currentUser.role === 'instructor' || currentUser.role === 'admin') && (
            <Link
              to="/courses/new"
              style={{ ...styles.link, ...(location.pathname === '/courses/new' ? styles.activeLink : {}) }}
            >
              강의 등록
            </Link>
          )}
        </div>

        <div style={styles.userArea}>
          {canUseCart && (
            <Link
              to="/cart"
              style={{ ...styles.cartBtn, ...(location.pathname === '/cart' ? styles.cartBtnActive : {}) }}
              title="장바구니"
            >
              🛒
              {cartItems.length > 0 && (
                <span style={styles.cartBadge}>{cartItems.length}</span>
              )}
            </Link>
          )}

          {currentUser ? (
            <>
              <span style={styles.userBadge}>{roleLabel(currentUser.role)} {currentUser.name}</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>로그아웃</button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{ ...styles.link, ...(location.pathname === '/login' ? styles.activeLink : {}) }}
              >
                로그인
              </Link>
              <Link
                to="/users/register"
                style={styles.registerBtn}
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: { backgroundColor: '#1a1a2e', borderBottom: '2px solid #e94560', position: 'sticky', top: 0, zIndex: 100 },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' },
  brand: { color: '#fff', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 700 },
  links: { display: 'flex', gap: '8px' },
  link: { color: '#ccc', textDecoration: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.9rem', transition: 'background 0.2s' },
  activeLink: { color: '#fff', backgroundColor: '#e94560' },
  userArea: { display: 'flex', alignItems: 'center', gap: '10px' },
  cartBtn: { position: 'relative', color: '#ccc', textDecoration: 'none', fontSize: '1.3rem', padding: '4px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center' },
  cartBtnActive: { color: '#fff', backgroundColor: 'rgba(233,69,96,0.2)' },
  cartBadge: { position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#e94560', color: '#fff', fontSize: '0.65rem', fontWeight: 700, minWidth: '18px', height: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' },
  userBadge: { color: '#aaa', fontSize: '0.85rem', backgroundColor: '#16213e', padding: '4px 12px', borderRadius: '20px', border: '1px solid #333' },
  logoutBtn: { backgroundColor: 'transparent', border: '1px solid #555', color: '#ccc', padding: '5px 12px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' },
  registerBtn: { backgroundColor: '#e94560', color: '#fff', textDecoration: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600 },
};
