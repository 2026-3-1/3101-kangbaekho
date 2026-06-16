import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('idempotency_keys')
export class IdempotencyKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 128 })
  key: string;

  @Column({ type: 'varchar', length: 64 })
  scope: string;

  /** 'pending' | 'completed' | 'failed' */
  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: string;

  @Column({ type: 'text', nullable: true })
  response: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
