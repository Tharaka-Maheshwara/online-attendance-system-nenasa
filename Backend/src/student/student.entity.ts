import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  registerNumber: string;

  @Column({ nullable: true })
  contactNumber: string;

  @Column({ nullable: true })
  parentName: string;

  @Column({ nullable: true })
  parentEmail: string;
}
