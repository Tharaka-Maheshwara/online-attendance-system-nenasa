import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Class {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  subject: string;

  @Column({ nullable: true })
  teacherId: number;

  @Column({ nullable: true })
  grade: number;

  @Column({ nullable: true })
  dayOfWeek: string;

  @Column({ nullable: true })
  startTime: string;

  @Column({ nullable: true })
  endTime: string;
}
