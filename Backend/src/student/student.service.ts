import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    private userService: UserService,
  ) {}

  private validateSubjects(createStudentDto: CreateStudentDto): void {
    const subjects = [
      createStudentDto.sub_1,
      createStudentDto.sub_2,
      createStudentDto.sub_3,
      createStudentDto.sub_4,
    ].filter(subject => subject !== undefined && subject !== null && subject !== '');

    if (subjects.length > 4) {
      throw new Error('A student can only be assigned to a maximum of 4 subjects');
    }

    // Check for duplicate subject assignments
    const uniqueSubjects = new Set(subjects);
    if (uniqueSubjects.size !== subjects.length) {
      throw new Error('Duplicate subject assignments are not allowed');
    }
  }

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    this.validateSubjects(createStudentDto);
    
    const student = this.studentRepository.create(createStudentDto);
    const savedStudent = await this.studentRepository.save(student);

    // Create or update user in nenasala_users table with student role
    try {
      const existingUser = await this.userService.findByEmail(
        createStudentDto.email,
      );

      if (existingUser) {
        // Update existing user with student role and student-specific data
        await this.userService.update(existingUser.id, {
          role: 'student',
          display_name: createStudentDto.name,
          register_number: createStudentDto.registerNumber,
          contactNumber: createStudentDto.contactNumber,
          parentEmail: createStudentDto.parentEmail,
          parentName: createStudentDto.parentName,
        });
      } else {
        // Create new user with student role
        await this.userService.createUser({
          email: createStudentDto.email,
          role: 'student',
          display_name: createStudentDto.name,
          register_number: createStudentDto.registerNumber,
          contactNumber: createStudentDto.contactNumber,
          parentEmail: createStudentDto.parentEmail,
          parentName: createStudentDto.parentName,
        });
      }
    } catch (error) {
      console.error('Error creating/updating user for student:', error);
      // Note: We don't throw here to avoid breaking student creation
      // But you might want to handle this differently based on your requirements
    }

    return savedStudent;
  }

  async findAll(): Promise<Student[]> {
    return await this.studentRepository.find();
  }

  async findOne(id: number): Promise<Student | null> {
    return await this.studentRepository.findOne({ where: { id } });
  }

  async update(
    id: number,
    updateStudentDto: Partial<CreateStudentDto>,
  ): Promise<Student | null> {
    // Get current student data for validation
    const currentStudent = await this.findOne(id);
    if (!currentStudent) {
      throw new Error('Student not found');
    }

    // Merge current data with updates for validation
    const mergedData = {
      ...currentStudent,
      ...updateStudentDto,
      sub_1: updateStudentDto.sub_1 ?? currentStudent.sub_1,
      sub_2: updateStudentDto.sub_2 ?? currentStudent.sub_2,
      sub_3: updateStudentDto.sub_3 ?? currentStudent.sub_3,
      sub_4: updateStudentDto.sub_4 ?? currentStudent.sub_4,
    };

    this.validateSubjects(mergedData);
    
    await this.studentRepository.update(id, updateStudentDto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.studentRepository.delete(id);
  }
}
