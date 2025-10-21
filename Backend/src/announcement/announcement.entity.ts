import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ type: 'enum', enum: ['low', 'normal', 'high'], default: 'normal' })
  priority: 'low' | 'normal' | 'high';

  @Column()
  teacherEmail: string;

  @Column()
  classId: number;

  @Column('simple-json')
  studentIds: number[];

  @Column({ default: 0 })
  recipientCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}