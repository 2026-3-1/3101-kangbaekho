import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int', nullable: true })
  actor_id: number | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  actor_role: string | null;

  @Column({ type: 'varchar', length: 64 })
  @Index()
  action: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  target_type: string | null;

  @Column({ type: 'int', nullable: true })
  target_id: number | null;

  @Column({ type: 'text', nullable: true })
  detail: string | null;

  @CreateDateColumn()
  @Index()
  created_at: Date;
}
