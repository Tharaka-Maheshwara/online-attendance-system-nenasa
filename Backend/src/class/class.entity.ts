import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Class {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  subject: string;

  @Column({ nullable: true })
  batch: string;

  @Column({ nullable: true })
  teacherId: number;
}
