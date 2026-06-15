import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  instructor_id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  instructor: string;

  @Column()
  category: string;

  @Column('int')
  price: number;

  @Column({ nullable: true })
  thumbnail_url: string;

  @Column({ nullable: true })
  youtube_url: string;

  @Column()
  max_students: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
