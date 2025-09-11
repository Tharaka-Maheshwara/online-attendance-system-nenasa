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
        teacher_id: user.register_number || `TEA-${user.id}`,
        user_id: user.id,
        phone_number: user.contactNumber,
        is_active: true,
      };

      const teacher = this.teacherRepository.create(teacherData);
      const savedTeacher = await this.teacherRepository.save(teacher);
      
      this.logger.log(`Teacher created automatically for user: ${user.email} with teacher_id: ${teacherData.teacher_id}`);
      return savedTeacher;
    } catch (error) {
      this.logger.error(`Failed to create teacher from user: ${user.email}`, error);
      throw error;
    }
  }

  async findAll(): Promise<Teacher[]> {
    return this.teacherRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' }
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
    return this.teacherRepository.findOne({
      where: { teacher_id: teacherId },
      relations: ['user']
    });
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
    return this.teacherRepository.find({
      where: { department },
      relations: ['user'],
      order: { teacher_id: 'ASC' }
    });
  }

  async getActiveTeachers(): Promise<Teacher[]> {
    return this.teacherRepository.find({
      where: { is_active: true },
      relations: ['user'],
      order: { teacher_id: 'ASC' }
    });
  }
}
