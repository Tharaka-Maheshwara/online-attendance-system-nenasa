import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './teacher.entity';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
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
    return await this.teacherRepository.save(teacher);
  }

  async findAll(): Promise<Teacher[]> {
    return await this.teacherRepository.find();
  }

  async findOne(id: number): Promise<Teacher | null> {
    return await this.teacherRepository.findOne({ where: { id } });
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
}
