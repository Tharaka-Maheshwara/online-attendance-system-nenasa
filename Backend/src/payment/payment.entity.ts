import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PaymentStatus = 'pending' | 'paid' | 'overdue';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  studentId: number;

  @Column()
  classId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  month: number; // 1-12

  @Column()
  year: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending',
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  paidDate: Date;

  @Column({ nullable: true })
  paidBy: number; // admin/teacher who marked as paid

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
