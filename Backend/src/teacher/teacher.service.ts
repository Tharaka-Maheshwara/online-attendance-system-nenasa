import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './teacher.entity';
import { Class } from '../class/class.entity';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    private userService: UserService,
  ) {}

  async create(createTeacherDto: CreateTeacherDto): Promise<Teacher> {
    // Validate that at least one subject is provided
    const hasAtLeastOneSubject =
      createTeacherDto.sub_01 ||
      createTeacherDto.sub_02 ||
      createTeacherDto.sub_03 ||
      createTeacherDto.sub_04;

    if (!hasAtLeastOneSubject) {
      throw new Error(
        'At least one subject (sub_01, sub_02, sub_03, or sub_04) must be provided',
      );
    }

    const teacher = this.teacherRepository.create(createTeacherDto);
    const savedTeacher = await this.teacherRepository.save(teacher);

    // Create or update user in nenasala_users table with teacher role
    try {
      const existingUser = await this.userService.findByEmail(
        createTeacherDto.email,
      );

      if (existingUser) {
        // Update existing user with teacher role and teacher-specific data
        await this.userService.update(existingUser.id, {
          role: 'teacher',
          display_name: createTeacherDto.name,
          register_number: createTeacherDto.registerNumber,
          contactNumber: createTeacherDto.contactNumber,
        });
      } else {
        // Create new user with teacher role
        await this.userService.createUser({
          email: createTeacherDto.email,
          role: 'teacher',
          display_name: createTeacherDto.name,
          register_number: createTeacherDto.registerNumber,
          contactNumber: createTeacherDto.contactNumber,
        });
      }
    } catch (error) {
      console.error('Error creating/updating user for teacher:', error);
      // Note: We don't throw here to avoid breaking teacher creation
      // But you might want to handle this differently based on your requirements
    }

    return savedTeacher;
  }

  async findAll(): Promise<Teacher[]> {
    return await this.teacherRepository.find();
  }

  async findOne(id: number): Promise<Teacher | null> {
    return await this.teacherRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Teacher | null> {
    return await this.teacherRepository.findOne({ where: { email } });
  }

  async update(
    id: number,
    updateTeacherDto: UpdateTeacherDto,
  ): Promise<Teacher | null> {
    const existingTeacher = await this.findOne(id);
    if (!existingTeacher) {
      throw new Error('Teacher not found');
    }

    // If updating subjects, ensure at least one remains
    const updatedTeacher = { ...existingTeacher, ...updateTeacherDto };
    const hasAtLeastOneSubject =
      updatedTeacher.sub_01 ||
      updatedTeacher.sub_02 ||
      updatedTeacher.sub_03 ||
      updatedTeacher.sub_04;

    if (!hasAtLeastOneSubject) {
      throw new Error(
        'At least one subject (sub_01, sub_02, sub_03, or sub_04) must be provided',
      );
    }

    await this.teacherRepository.update(id, updateTeacherDto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.teacherRepository.delete(id);
  }

  async getTodayClasses(teacherId: number): Promise<Class[]> {
    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today.getDay()];

    // Find all classes for this teacher on today's day
    const classes = await this.classRepository.find({
      where: {
        teacherId: teacherId,
        dayOfWeek: todayName,
      },
      order: {
        startTime: 'ASC',
      },
    });

    return classes;
  }
}
