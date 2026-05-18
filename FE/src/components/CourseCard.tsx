import { Link } from 'react-router-dom';
import { Course } from '../types';

interface CourseCardProps {
  course: Course;
  isEnrolled?: boolean;
  isInCart?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canUseCart?: boolean;
  canViewStudents?: boolean;
  onDelete?: (id: number) => void;
  onCartToggle?: (courseId: number) => void;
}

export default function CourseCard({
  course,
  isEnrolled = false,
  isInCart = false,
  canEdit = false,
  canDelete = false,
  canUseCart = false,
  canViewStudents = false,
  onDelete,
  onCartToggle,
}: CourseCardProps) {
  return (
    <div style={styles.card}>
      <div style={styles.thumbnailWrapper}>
        <img
          src={course.thumbnail_url}
          alt={course.title}
          style={styles.thumbnail}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://placehold.co/400x225/cccccc/666?text=No+Image';
          }}
        />
        <span style={styles.categoryBadge}>{course.category}</span>
      </div>
      <div style={styles.body}>
        <h3 style={styles.title}>{course.title}</h3>
        <p style={styles.instructor}>강사: {course.instructor}</p>
        <p style={styles.description}>{course.description}</p>
        <div style={styles.footer}>
          <span style={styles.price}>
            {course.price.toLocaleString()}원
          </span>
          <span style={styles.capacity}>
            최대 {course.max_students}명
          </span>
        </div>
        <div style={styles.actions}>
          <Link to={`/courses/${course.id}`} style={styles.detailBtn}>
            상세보기
          </Link>
          {canUseCart && !isEnrolled && onCartToggle && (
            <button
              onClick={() => onCartToggle(course.id)}
              style={isInCart ? styles.cartBtnActive : styles.cartBtn}
              title={isInCart ? '장바구니에서 제거' : '장바구니 담기'}
            >
              🛒
            </button>
          )}
          {canViewStudents && (
            <Link to={`/courses/${course.id}/students`} style={styles.studentsBtn}>
              👥 수강생
            </Link>
          )}
          {canEdit && (
            <Link to={`/courses/${course.id}/edit`} style={styles.editBtn}>
              수정
            </Link>
          )}
          {canDelete && onDelete && (
            <button
              onClick={() => onDelete(course.id)}
              style={styles.deleteBtn}
            >
              삭제
            </button>
          )}
          {isEnrolled && (
            <span style={styles.enrolledBadge}>✓ 수강 중</span>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '160px',
    objectFit: 'cover',
    display: 'block',
  },
  categoryBadge: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    backgroundColor: '#e94560',
    color: '#fff',
    fontSize: '0.75rem',
    padding: '3px 10px',
    borderRadius: '20px',
    fontWeight: 600,
  },
  body: {
    padding: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  title: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 700,
    color: '#1a1a2e',
    lineHeight: 1.4,
  },
  instructor: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#666',
  },
  description: {
    margin: 0,
    fontSize: '0.83rem',
    color: '#555',
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    flex: 1,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '4px',
  },
  price: {
    fontWeight: 700,
    color: '#e94560',
    fontSize: '1rem',
  },
  capacity: {
    fontSize: '0.8rem',
    color: '#888',
  },
  actions: {
    display: 'flex',
    gap: '6px',
    marginTop: '8px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  detailBtn: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: '6px 14px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '0.82rem',
    fontWeight: 600,
  },
  cartBtn: {
    backgroundColor: '#fff',
    color: '#e94560',
    border: '1.5px solid #e94560',
    padding: '5px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  cartBtnActive: {
    backgroundColor: '#fff5f7',
    color: '#e94560',
    border: '1.5px solid #e94560',
    padding: '5px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  studentsBtn: {
    backgroundColor: '#f0f4ff',
    color: '#0f3460',
    padding: '6px 12px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  editBtn: {
    backgroundColor: '#0f3460',
    color: '#fff',
    padding: '6px 14px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '0.82rem',
  },
  deleteBtn: {
    backgroundColor: '#ff4444',
    color: '#fff',
    padding: '6px 14px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.82rem',
  },
  enrolledBadge: {
    backgroundColor: '#22c55e',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.78rem',
    fontWeight: 600,
    marginLeft: 'auto',
  },
};
