import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './teacher.entity';
import { User } from '../user/user.entity';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Injectable()
export class TeacherService {
  private readonly logger = new Logger(TeacherService.name);

  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createTeacher(createTeacherDto: CreateTeacherDto): Promise<Teacher> {
    try {
      const teacher = this.teacherRepository.create(createTeacherDto);
      const savedTeacher = await this.teacherRepository.save(teacher);
      this.logger.log(`Teacher created with ID: ${savedTeacher.id}`);
      return savedTeacher;
    } catch (error) {
      this.logger.error('Failed to create teacher:', error);
      throw error;
    }
  }

  async createTeacherFromUser(user: User): Promise<Teacher> {
    try {
      // Check if teacher already exists
      const existingTeacher = await this.teacherRepository.findOne({
        where: { user_id: user.id }
      });

      if (existingTeacher) {
        this.logger.log(`Teacher already exists for user ID: ${user.id}`);
        return existingTeacher;
      }

      const teacherData = {
        user_id: user.id,
        subject_1: 'Unknown', // Default subject, should be set properly in real use
        phone_number: user.contactNumber
      };

      const teacher = this.teacherRepository.create(teacherData);
      const savedTeacher = await this.teacherRepository.save(teacher);
      
      this.logger.log(`Teacher created automatically for user: ${user.email}`);
      return savedTeacher;
    } catch (error) {
      this.logger.error(`Failed to create teacher from user: ${user.email}`, error);
      throw error;
    }
  }

  async findAll(): Promise<Teacher[]> {
    return this.teacherRepository.find({
      relations: ['user']
    });
  }

  async findOne(id: number): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { id },
      relations: ['user']
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return teacher;
  }

  async findByUserId(userId: number): Promise<Teacher | null> {
    return this.teacherRepository.findOne({
      where: { user_id: userId },
      relations: ['user']
    });
  }

  async findByTeacherId(teacherId: string): Promise<Teacher | null> {
    // teacher_id field removed, so this method is now invalid
    // Consider removing this method or updating logic if needed
    return null;
  }

  async update(id: number, updateTeacherDto: UpdateTeacherDto): Promise<Teacher> {
    const teacher = await this.findOne(id);
    
    Object.assign(teacher, updateTeacherDto);
    const updatedTeacher = await this.teacherRepository.save(teacher);
    
    this.logger.log(`Teacher updated with ID: ${id}`);
    return updatedTeacher;
  }

  async remove(id: number): Promise<void> {
    const teacher = await this.findOne(id);
    await this.teacherRepository.remove(teacher);
    this.logger.log(`Teacher deleted with ID: ${id}`);
  }

  async getTeachersByDepartment(department: string): Promise<Teacher[]> {
    // department and teacher_id fields removed, so this method is now invalid
    // Consider removing this method or updating logic if needed
    return [];
  }

  async getActiveTeachers(): Promise<Teacher[]> {
    // is_active and teacher_id fields removed, so this method is now invalid
    // Consider removing this method or updating logic if needed
    return [];
  }
}
