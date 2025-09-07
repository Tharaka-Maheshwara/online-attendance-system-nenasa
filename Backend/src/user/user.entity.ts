import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type UserRole = 'admin' | 'student' | 'teacher';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: ['admin', 'student', 'teacher'] })
  role: UserRole;

  @Column({ nullable: true })
  profilePhoto: string;

  @Column({ nullable: true })
  contact: string;

  @Column({ nullable: true })
  classId: number;
}
