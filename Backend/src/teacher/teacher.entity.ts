import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Teacher {
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
  sub_01: string;

  @Column({ nullable: true })
  sub_02: string;

  @Column({ nullable: true })
  sub_03: string;

  @Column({ nullable: true })
  sub_04: string;

  @Column({ nullable: true })
  profileImage: string;
}
