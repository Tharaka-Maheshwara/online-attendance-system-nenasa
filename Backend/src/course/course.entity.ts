import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Teacher } from '../teacher/teacher.entity';

@Entity()
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  courseName: string;

  @Column()
  duration: string; // e.g., "6 months", "1 year"

  @Column({ type: 'date' })
  startDate: Date;

  @Column()
  maxStudents: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  teacherId: number;

  @ManyToOne(() => Teacher, { eager: true })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @Column({ default: 0 })
  enrolledStudents: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
