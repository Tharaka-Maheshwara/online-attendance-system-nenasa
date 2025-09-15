import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('teachers')
export class Teacher {
  @PrimaryGeneratedColumn()
  id: number;


  @Column()
  user_id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;



  @Column()
  subject_1: string;

  @Column({ nullable: true })
  subject_2: string;

  @Column({ nullable: true })
  subject_3: string;

  @Column({ nullable: true })
  subject_4: string;




  @Column({ nullable: true })
  phone_number: string;




}
