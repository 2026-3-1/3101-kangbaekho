import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentItem } from './payment-item.entity';

@Entity('payments')
@Index(['user_id', 'created_at'])
@Index(['status', 'created_at'])
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  user_id: number;

  @Column('int')
  total_amount: number;

  @Index()
  @Column({ default: 'completed' })
  status: string;

  @Index({ unique: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
  order_id: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  payment_key: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  method: string | null;

  @OneToMany(() => PaymentItem, (item) => item.payment, {
    cascade: true,
    eager: true,
  })
  items: PaymentItem[];

  @CreateDateColumn()
  created_at: Date;
}
