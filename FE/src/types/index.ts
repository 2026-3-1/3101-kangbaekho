export interface Course {
  id: number;
  instructor_id: number;
  title: string;
  description: string;
  instructor: string;
  category: string;
  price: number;
  thumbnail_url: string;
  youtube_url?: string;
  max_students: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  enrolled_at: string;
  progress_percent: number;
  last_position_seconds: number;
  completed_at: string | null;
  course?: Course;
}

export interface CartItem {
  id: number;
  user_id: number;
  course_id: number;
  added_at: string;
  course: Course;
}

export interface PaymentItem {
  id: number;
  payment_id: number;
  course_id: number;
  price: number;
  course: Course;
}

export interface Payment {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  items: PaymentItem[];
  created_at: string;
}
