import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type AttendanceStatus = 'present' | 'absent' | 'late';

@Entity()
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  studentId: number;

  @Column()
  classId: number;

  @Column({ type: 'date' })
  date: string;

  @Column({
    type: 'enum',
    enum: ['present', 'absent', 'late'],
    default: 'absent',
  })
  status: AttendanceStatus;

  @Column({ default: false })
  isPresent: boolean;

  @Column({ nullable: true })
  markedBy: number; // teacher/admin id

  @Column({ nullable: true })
  method: string; // manual, qr

  @Column({ nullable: true })
  late: boolean;

  @Column({ type: 'timestamp', nullable: true })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
