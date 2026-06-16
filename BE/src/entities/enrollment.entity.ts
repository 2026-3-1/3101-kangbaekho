import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Course } from './course.entity';
import { User } from './user.entity';

@Entity('enrollments')
@Index('uq_enrollment_user_course', ['user_id', 'course_id'], { unique: true })
@Index(['course_id', 'completed_at'])
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  course_id: number;

  @ManyToOne(() => Course, { eager: false })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  student: User;

  @Column({ type: 'int', default: 0 })
  progress_percent: number;

  @Column({ type: 'int', default: 0 })
  last_position_seconds: number;

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date | null;

  @CreateDateColumn()
  enrolled_at: Date;
}
