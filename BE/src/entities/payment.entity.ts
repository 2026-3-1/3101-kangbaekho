import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentItem } from './payment-item.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column('int')
  total_amount: number;

  @Column({ default: 'completed' })
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  order_id: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  payment_key: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  method: string | null;

  @OneToMany(() => PaymentItem, (item) => item.payment, { cascade: true, eager: true })
  items: PaymentItem[];

  @CreateDateColumn()
  created_at: Date;
}
