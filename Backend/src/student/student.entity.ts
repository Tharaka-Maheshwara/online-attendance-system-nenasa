import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  student_id: string; // This will be the register_number from User

  @Column()
  user_id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  grade: string;

  @Column({ nullable: true })
  class_section: string;

  @Column({ nullable: true })
  admission_date: Date;

  @Column({ nullable: true })
  guardian_name: string;

  @Column({ nullable: true })
  guardian_phone: string;

  @Column({ nullable: true })
  guardian_email: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
