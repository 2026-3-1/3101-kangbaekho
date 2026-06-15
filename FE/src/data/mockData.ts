import { Course, User, Enrollment } from '../types';

export const initialCourses: Course[] = [
  {
    id: 1,
    instructor_id: 0,
    title: 'React 완전 정복 - 기초부터 고급까지',
    description:
      'React의 기본 개념부터 고급 패턴까지 체계적으로 배웁니다. Hooks, Context API, 성능 최적화 기법을 다룹니다.',
    instructor: '김철수',
    category: '프론트엔드',
    price: 89000,
    thumbnail_url: 'https://placehold.co/400x225/61DAFB/000?text=React',
    max_students: 100,
    created_at: '2025-01-10T09:00:00Z',
    updated_at: '2025-01-10T09:00:00Z',
  },
  {
    id: 2,
    instructor_id: 0,
    title: 'NestJS로 배우는 백엔드 개발',
    description:
      'TypeScript 기반의 NestJS 프레임워크를 활용하여 실무 수준의 백엔드 API를 구축합니다. REST API, 인증, DB 연동을 다룹니다.',
    instructor: '이영희',
    category: '백엔드',
    price: 99000,
    thumbnail_url: 'https://placehold.co/400x225/E0234E/fff?text=NestJS',
    max_students: 80,
    created_at: '2025-01-15T09:00:00Z',
    updated_at: '2025-01-15T09:00:00Z',
  },
  {
    id: 3,
    instructor_id: 0,
    title: 'Python 데이터 분석 입문',
    description:
      'Python을 이용한 데이터 분석의 기초를 배웁니다. Pandas, NumPy, Matplotlib을 활용한 실습 위주의 강의입니다.',
    instructor: '박민준',
    category: '데이터사이언스',
    price: 79000,
    thumbnail_url: 'https://placehold.co/400x225/3776AB/fff?text=Python',
    max_students: 120,
    created_at: '2025-02-01T09:00:00Z',
    updated_at: '2025-02-01T09:00:00Z',
  },
  {
    id: 4,
    instructor_id: 0,
    title: 'Docker & Kubernetes 실전 가이드',
    description:
      '컨테이너 기술의 핵심인 Docker와 Kubernetes를 실전 프로젝트를 통해 마스터합니다. CI/CD 파이프라인 구축까지 다룹니다.',
    instructor: '최지훈',
    category: 'DevOps',
    price: 109000,
    thumbnail_url: 'https://placehold.co/400x225/2496ED/fff?text=Docker',
    max_students: 60,
    created_at: '2025-02-10T09:00:00Z',
    updated_at: '2025-02-10T09:00:00Z',
  },
  {
    id: 5,
    instructor_id: 0,
    title: 'UI/UX 디자인 기초와 Figma 활용',
    description:
      '사용자 중심 디자인 원칙과 Figma 도구 사용법을 배웁니다. 와이어프레임부터 프로토타입 제작까지 실습합니다.',
    instructor: '정수연',
    category: 'UI/UX',
    price: 69000,
    thumbnail_url: 'https://placehold.co/400x225/A259FF/fff?text=Figma',
    max_students: 90,
    created_at: '2025-02-20T09:00:00Z',
    updated_at: '2025-02-20T09:00:00Z',
  },
  {
    id: 6,
    instructor_id: 0,
    title: 'Java Spring Boot 웹 개발',
    description:
      'Java와 Spring Boot를 이용한 엔터프라이즈 웹 애플리케이션 개발을 배웁니다. JPA, Security, REST API 설계를 다룹니다.',
    instructor: '한동현',
    category: '백엔드',
    price: 95000,
    thumbnail_url: 'https://placehold.co/400x225/6DB33F/fff?text=Spring',
    max_students: 100,
    created_at: '2025-03-01T09:00:00Z',
    updated_at: '2025-03-01T09:00:00Z',
  },
  {
    id: 7,
    instructor_id: 0,
    title: 'Vue.js 3 완벽 가이드',
    description:
      'Vue.js 3의 Composition API를 중심으로 현대적인 프론트엔드 개발 방법론을 학습합니다. Pinia 상태관리도 포함됩니다.',
    instructor: '윤서연',
    category: '프론트엔드',
    price: 84000,
    thumbnail_url: 'https://placehold.co/400x225/4FC08D/fff?text=Vue.js',
    max_students: 75,
    created_at: '2025-03-10T09:00:00Z',
    updated_at: '2025-03-10T09:00:00Z',
  },
];

export const initialUsers: User[] = [
  {
    id: 1,
    name: '홍길동',
    email: 'hong@example.com',
    role: 'student',
    created_at: '2025-01-01T09:00:00Z',
  },
  {
    id: 2,
    name: '김관리자',
    email: 'admin@example.com',
    role: 'admin',
    created_at: '2025-01-01T08:00:00Z',
  },
];

export const initialEnrollments: Enrollment[] = [
  {
    id: 1,
    user_id: 1,
    course_id: 1,
    enrolled_at: '2025-01-20T10:00:00Z',
    progress_percent: 0,
    last_position_seconds: 0,
    completed_at: null,
  },
  {
    id: 2,
    user_id: 1,
    course_id: 3,
    enrolled_at: '2025-02-05T11:00:00Z',
    progress_percent: 0,
    last_position_seconds: 0,
    completed_at: null,
  },
];
