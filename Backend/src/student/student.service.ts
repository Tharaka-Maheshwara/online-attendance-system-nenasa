import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { User } from '../user/user.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createStudent(createStudentDto: CreateStudentDto): Promise<Student> {
    try {
      const student = this.studentRepository.create(createStudentDto);
      const savedStudent = await this.studentRepository.save(student);
      this.logger.log(`Student created with ID: ${savedStudent.id}`);
      return savedStudent;
    } catch (error) {
      this.logger.error('Failed to create student:', error);
      throw error;
    }
  }

  async createStudentFromUser(user: User): Promise<Student> {
    try {
      // Check if student already exists
      const existingStudent = await this.studentRepository.findOne({
        where: { user_id: user.id }
      });

      if (existingStudent) {
        this.logger.log(`Student already exists for user ID: ${user.id}`);
        return existingStudent;
      }

      const studentData = {
        student_id: user.register_number || `STU-${user.id}`,
        user_id: user.id,
        guardian_name: user.parentName,
        guardian_email: user.parentEmail,
        is_active: true,
      };

      const student = this.studentRepository.create(studentData);
      const savedStudent = await this.studentRepository.save(student);
      
      this.logger.log(`Student created automatically for user: ${user.email} with student_id: ${studentData.student_id}`);
      return savedStudent;
    } catch (error) {
      this.logger.error(`Failed to create student from user: ${user.email}`, error);
      throw error;
    }
  }

  async findAll(): Promise<Student[]> {
    return this.studentRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['user', 'attendances']
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  async findByUserId(userId: number): Promise<Student | null> {
    return this.studentRepository.findOne({
      where: { user_id: userId },
      relations: ['user']
    });
  }

  async findByStudentId(studentId: string): Promise<Student | null> {
    return this.studentRepository.findOne({
      where: { student_id: studentId },
      relations: ['user']
    });
  }

  async update(id: number, updateStudentDto: UpdateStudentDto): Promise<Student> {
    const student = await this.findOne(id);
    
    Object.assign(student, updateStudentDto);
    const updatedStudent = await this.studentRepository.save(student);
    
    this.logger.log(`Student updated with ID: ${id}`);
    return updatedStudent;
  }

  async remove(id: number): Promise<void> {
    const student = await this.findOne(id);
    await this.studentRepository.remove(student);
    this.logger.log(`Student deleted with ID: ${id}`);
  }

  async getStudentsByGrade(grade: string): Promise<Student[]> {
    return this.studentRepository.find({
      where: { grade },
      relations: ['user'],
      order: { student_id: 'ASC' }
    });
  }

  async getActiveStudents(): Promise<Student[]> {
    return this.studentRepository.find({
      where: { is_active: true },
      relations: ['user'],
      order: { student_id: 'ASC' }
    });
  }
}
