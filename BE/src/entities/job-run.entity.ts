import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('job_runs')
export class JobRun {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  name: string;

  /** 'running' | 'success' | 'failed' | 'skipped' */
  @Index()
  @Column({ type: 'varchar', length: 16 })
  status: string;

  @Column({ type: 'datetime' })
  started_at: Date;

  @Column({ type: 'datetime', nullable: true })
  finished_at: Date | null;

  /** 실행에 걸린 시간 (ms) — finished_at - started_at */
  @Column({ type: 'int', default: 0 })
  duration_ms: number;

  /** 처리한 레코드 수 */
  @Column({ type: 'int', default: 0 })
  processed: number;

  @Column({ type: 'text', nullable: true })
  detail: string | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn()
  created_at: Date;
}
