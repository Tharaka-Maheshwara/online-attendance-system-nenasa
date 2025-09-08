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

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'enum', enum: ['admin', 'student', 'teacher'] })
  role: UserRole;

  @Column({ nullable: true })
  profilePhoto: string;

  @Column({ nullable: true })
  contact: string;

  @Column({ nullable: true })
  classId: number;

  // Azure AD Integration fields
  @Column({ nullable: true, unique: true })
  azureId: string;

  @Column({ nullable: true })
  userPrincipalName: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true, type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastAzureSync: Date;

  @Column({ nullable: true, default: false })
  isAzureUser: boolean;
}
