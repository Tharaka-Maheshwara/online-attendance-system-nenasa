import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

  @Column({ default: false })
  isPresent: boolean;

  @Column({ nullable: true })
  markedBy: number; // teacher/admin id

  @Column({ nullable: true })
  method: string; // manual, qr

  @Column({ nullable: true })
  late: boolean;
}
