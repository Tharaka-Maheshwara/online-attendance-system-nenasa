import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('teachers')
export class Teacher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  teacher_id: string; // This will be the register_number from User

  @Column()
  user_id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  employee_id: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  subject_specialization: string;

  @Column({ nullable: true })
  qualification: string;

  @Column({ nullable: true })
  experience_years: number;

  @Column({ nullable: true })
  joining_date: Date;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  emergency_contact: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
