import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './course.entity';
import { Teacher } from '../teacher/teacher.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
  ) {}

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    const course = this.courseRepository.create(createCourseDto);
    return await this.courseRepository.save(course);
  }

  async findAll(): Promise<Course[]> {
    return await this.courseRepository.find({
      relations: ['teacher'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['teacher'],
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    return course;
  }

  async update(id: number, updateCourseDto: UpdateCourseDto): Promise<Course> {
    const course = await this.findOne(id);
    Object.assign(course, updateCourseDto);
    return await this.courseRepository.save(course);
  }

  async remove(id: number): Promise<void> {
    const course = await this.findOne(id);
    await this.courseRepository.remove(course);
  }

  async getActiveCourses(): Promise<Course[]> {
    return await this.courseRepository.find({
      where: { isActive: true },
      relations: ['teacher'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllTeachers(): Promise<Teacher[]> {
    return await this.teacherRepository.find({
      order: { name: 'ASC' },
    });
  }

  async updateEnrollmentCount(id: number, count: number): Promise<Course> {
    const course = await this.findOne(id);
    course.enrolledStudents = count;
    return await this.courseRepository.save(course);
  }
}
