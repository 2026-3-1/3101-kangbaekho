import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Course } from '../types';

const CATEGORIES = [
  '프론트엔드',
  '백엔드',
  '데이터사이언스',
  'DevOps',
  'UI/UX',
  '모바일',
  '기타',
];

type FormData = Omit<Course, 'id' | 'created_at' | 'updated_at'>;

const emptyForm: FormData = {
  title: '',
  description: '',
  instructor: '',
  category: CATEGORIES[0],
  price: 0,
  thumbnail_url: '',
  max_students: 30,
};

export default function CourseFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { courses, addCourse, updateCourse } = useApp();

  const isEdit = Boolean(id);
  const existingCourse = isEdit ? courses.find((c) => c.id === Number(id)) : null;

  const [form, setForm] = useState<FormData>(
    existingCourse
      ? {
          title: existingCourse.title,
          description: existingCourse.description,
          instructor: existingCourse.instructor,
          category: existingCourse.category,
          price: existingCourse.price,
          thumbnail_url: existingCourse.thumbnail_url,
          max_students: existingCourse.max_students,
        }
      : emptyForm
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );

  useEffect(() => {
    if (isEdit && existingCourse) {
      setForm({
        title: existingCourse.title,
        description: existingCourse.description,
        instructor: existingCourse.instructor,
        category: existingCourse.category,
        price: existingCourse.price,
        thumbnail_url: existingCourse.thumbnail_url,
        max_students: existingCourse.max_students,
      });
    }
  }, [id]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.title.trim()) newErrors.title = '제목을 입력해주세요.';
    if (!form.description.trim()) newErrors.description = '설명을 입력해주세요.';
    if (!form.instructor.trim()) newErrors.instructor = '강사명을 입력해주세요.';
    if (form.price < 0) newErrors.price = '가격은 0 이상이어야 합니다.';
    if (form.max_students < 1)
      newErrors.max_students = '최대 수강 인원은 1명 이상이어야 합니다.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEdit && id) {
        await updateCourse(Number(id), form);
        alert('강의가 수정되었습니다.');
        navigate(`/courses/${id}`);
      } else {
        await addCourse(form);
        alert('강의가 등록되었습니다.');
        navigate('/');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '요청에 실패했습니다.');
    }
  };

  const handleChange = (
    key: keyof FormData,
    value: string | number
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.heading}>
          {isEdit ? '강의 수정' : '새 강의 등록'}
        </h1>
        <p style={styles.subheading}>
          {isEdit
            ? '강의 정보를 수정합니다.'
            : '새로운 강의를 플랫폼에 등록합니다.'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>강의 제목 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="강의 제목을 입력하세요"
              style={{
                ...styles.input,
                ...(errors.title ? styles.inputError : {}),
              }}
            />
            {errors.title && <span style={styles.error}>{errors.title}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>강사명 *</label>
            <input
              type="text"
              value={form.instructor}
              onChange={(e) => handleChange('instructor', e.target.value)}
              placeholder="강사 이름"
              style={{
                ...styles.input,
                ...(errors.instructor ? styles.inputError : {}),
              }}
            />
            {errors.instructor && (
              <span style={styles.error}>{errors.instructor}</span>
            )}
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>카테고리</label>
              <select
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                style={styles.select}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>수강료 (원) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) =>
                  handleChange('price', Number(e.target.value))
                }
                min={0}
                step={1000}
                style={{
                  ...styles.input,
                  ...(errors.price ? styles.inputError : {}),
                }}
              />
              {errors.price && (
                <span style={styles.error}>{errors.price}</span>
              )}
            </div>

            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>최대 수강 인원 *</label>
              <input
                type="number"
                value={form.max_students}
                onChange={(e) =>
                  handleChange('max_students', Number(e.target.value))
                }
                min={1}
                style={{
                  ...styles.input,
                  ...(errors.max_students ? styles.inputError : {}),
                }}
              />
              {errors.max_students && (
                <span style={styles.error}>{errors.max_students}</span>
              )}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>썸네일 URL</label>
            <input
              type="text"
              value={form.thumbnail_url}
              onChange={(e) => handleChange('thumbnail_url', e.target.value)}
              placeholder="https://example.com/image.jpg"
              style={styles.input}
            />
            {form.thumbnail_url && (
              <img
                src={form.thumbnail_url}
                alt="미리보기"
                style={styles.preview}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>강의 설명 *</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="강의에 대한 상세한 설명을 입력하세요"
              rows={5}
              style={{
                ...styles.textarea,
                ...(errors.description ? styles.inputError : {}),
              }}
            />
            {errors.description && (
              <span style={styles.error}>{errors.description}</span>
            )}
          </div>

          <div style={styles.buttons}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={styles.cancelBtn}
            >
              취소
            </button>
            <button type="submit" style={styles.submitBtn}>
              {isEdit ? '수정 완료' : '강의 등록'}
            </button>
          </div>
        </form>
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
    maxWidth: '760px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  heading: {
    margin: '0 0 8px',
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#1a1a2e',
  },
  subheading: {
    color: '#888',
    marginBottom: '32px',
    fontSize: '0.95rem',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  row: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#444',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1.5px solid #ddd',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#e94560',
  },
  select: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1.5px solid #ddd',
    fontSize: '0.95rem',
    outline: 'none',
    backgroundColor: '#fff',
    width: '100%',
    boxSizing: 'border-box',
  },
  textarea: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1.5px solid #ddd',
    fontSize: '0.95rem',
    outline: 'none',
    resize: 'vertical',
    lineHeight: 1.6,
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  preview: {
    marginTop: '8px',
    width: '100%',
    maxHeight: '200px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #eee',
  },
  error: {
    color: '#e94560',
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
  },
  cancelBtn: {
    padding: '12px 28px',
    borderRadius: '10px',
    border: '2px solid #ddd',
    backgroundColor: '#fff',
    color: '#555',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 600,
  },
  submitBtn: {
    padding: '12px 28px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#e94560',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 700,
  },
};
