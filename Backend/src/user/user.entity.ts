import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type UserRole = 'admin' | 'student' | 'teacher';

@Entity('nenasala_users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, unique: true })
  azureId: string;

  @Column({ nullable: true })
  display_name: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'enum', enum: ['admin', 'student', 'teacher'] })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  contactNumber: string;

  @Column({ nullable: true, unique: true })
  register_number: string;

  @Column({ nullable: true })
  parentEmail: string;

  @Column({ nullable: true })
  parentName: string;
}
