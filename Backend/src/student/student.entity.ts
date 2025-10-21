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

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  grade: number;

  // Subject names (maximum 6 subjects per student)
  @Column({ nullable: true })
  sub_1: string;

  @Column({ nullable: true })
  sub_2: string;

  @Column({ nullable: true })
  sub_3: string;

  @Column({ nullable: true })
  sub_4: string;

  @Column({ nullable: true })
  sub_5: string;

  @Column({ nullable: true })
  sub_6: string;

  // Student profile image path
  @Column({ nullable: true })
  profileImage: string;
}
