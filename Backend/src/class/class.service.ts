import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './class.entity';
import { Student } from '../student/student.entity';
import { Attendance } from '../attendance/attendance.entity';

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
  ) {}

  async create(cls: Partial<Class>): Promise<Class> {
    return this.classRepository.save(cls);
  }

  async findAll(): Promise<Class[]> {
    return this.classRepository.find();
  }

  async findOne(id: number): Promise<Class | null> {
    return this.classRepository.findOne({ where: { id } });
  }

  async update(id: number, cls: Partial<Class>): Promise<Class | null> {
    await this.classRepository.update(id, cls);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.classRepository.delete(id);
  }

  async getEnrolledStudentsCount(classId: number): Promise<number> {
    // Get the class details
    const cls = await this.findOne(classId);
    if (!cls) {
      return 0;
    }

    // Count students who have this subject and grade
    const students = await this.studentRepository
      .createQueryBuilder('student')
      .where('student.grade = :grade', { grade: cls.grade })
      .andWhere(
        '(student.sub_1 = :subject OR student.sub_2 = :subject OR student.sub_3 = :subject OR student.sub_4 = :subject OR student.sub_5 = :subject OR student.sub_6 = :subject)',
        { subject: cls.subject },
      )
      .getCount();

    return students;
  }

  async getAllClassesWithStudentCount(): Promise<any[]> {
    const classes = await this.findAll();
    
    const classesWithCount = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await this.getEnrolledStudentsCount(cls.id);
        return {
          ...cls,
          enrolledStudents: studentCount,
        };
      }),
    );

    return classesWithCount;
  }
}
