import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type NotificationType = 'email' | 'sms';
export type NotificationStatus = 'sent' | 'failed' | 'pending';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  recipientEmail: string;

  @Column()
  subject: string;

  @Column('text')
  message: string;

  @Column({ type: 'enum', enum: ['email', 'sms'], default: 'email' })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: ['sent', 'failed', 'pending'],
    default: 'pending',
  })
  status: NotificationStatus;

  @Column({ nullable: true })
  studentId: number;

  @Column({ nullable: true })
  classId: number;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  sentAt: Date;
}
