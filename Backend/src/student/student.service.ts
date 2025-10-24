import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UserService } from '../user/user.service';
import { Class } from '../class/class.entity';
import { Payment } from '../payment/payment.entity';
import * as QRCode from 'qrcode';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private userService: UserService,
  ) {}

  private validateSubjects(createStudentDto: CreateStudentDto): void {
    const subjects = [
      createStudentDto.sub_1,
      createStudentDto.sub_2,
      createStudentDto.sub_3,
      createStudentDto.sub_4,
    ].filter(
      (subject) => subject !== undefined && subject !== null && subject !== '',
    );

    if (subjects.length > 4) {
      throw new Error(
        'A student can only be assigned to a maximum of 4 subjects',
      );
    }

    // Check for duplicate subject assignments
    const uniqueSubjects = new Set(subjects);
    if (uniqueSubjects.size !== subjects.length) {
      throw new Error('Duplicate subject assignments are not allowed');
    }
  }

  async generateQRCodeDataURL(student: Student): Promise<string> {
    // Create QR code data with student information
    const qrData = {
      studentId: student.id,
      name: student.name,
      registerNumber: student.registerNumber,
      email: student.email,
      type: 'student_attendance',
    };

    try {
      // Generate QR code as base64 data URL
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
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

    const result = await this.findOne(savedStudent.id);
    return result || savedStudent;
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

  async findByQRData(qrData: any): Promise<Student | null> {
    try {
      // If qrData contains studentId, find by ID
      if (qrData.studentId) {
        return await this.findOne(qrData.studentId);
      }

      // If qrData contains registerNumber, find by register number
      if (qrData.registerNumber) {
        return await this.studentRepository.findOne({
          where: { registerNumber: qrData.registerNumber },
        });
      }

      return null;
    } catch (error) {
      console.error('Error finding student by QR data:', error);
      return null;
    }
  }

  async getTodayClassesForStudent(studentId: number): Promise<Class[]> {
    try {
      // Get student details
      const student = await this.findOne(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      // Get student's subjects
      const studentSubjects = [
        student.sub_1,
        student.sub_2,
        student.sub_3,
        student.sub_4,
        student.sub_5,
        student.sub_6,
      ].filter((subject) => subject && subject.trim() !== '');

      if (studentSubjects.length === 0) {
        return [];
      }

      // Get today's day of week
      const today = new Date();
      const daysOfWeek = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      const todayDayOfWeek = daysOfWeek[today.getDay()];

      // Find classes for student's subjects that are scheduled for today
      const todayClasses = await this.classRepository
        .createQueryBuilder('class')
        .where('class.subject IN (:...subjects)', { subjects: studentSubjects })
        .andWhere('class.dayOfWeek = :dayOfWeek', { dayOfWeek: todayDayOfWeek })
        .orderBy('class.startTime', 'ASC')
        .getMany();

      return todayClasses;
    } catch (error) {
      console.error("Error fetching today's classes for student:", error);
      return [];
    }
  }

  async getTodayClassesForStudentByEmail(email: string): Promise<Class[]> {
    try {
      // Find student by email
      const student = await this.studentRepository.findOne({
        where: { email },
      });

      if (!student) {
        throw new Error('Student not found with email: ' + email);
      }

      // Use the existing method with the student ID
      return await this.getTodayClassesForStudent(student.id);
    } catch (error) {
      console.error(
        "Error fetching today's classes for student by email:",
        error,
      );
      return [];
    }
  }

  async getAllClassesForStudent(studentId: number): Promise<Class[]> {
    try {
      // Get student details
      const student = await this.findOne(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      // Get student's subjects
      const studentSubjects = [
        student.sub_1,
        student.sub_2,
        student.sub_3,
        student.sub_4,
        student.sub_5,
        student.sub_6,
      ].filter((subject) => subject && subject.trim() !== '');

      if (studentSubjects.length === 0) {
        return [];
      }

      // Find all classes for student's subjects
      const allClasses = await this.classRepository
        .createQueryBuilder('class')
        .where('class.subject IN (:...subjects)', { subjects: studentSubjects })
        .orderBy('class.dayOfWeek', 'ASC')
        .addOrderBy('class.startTime', 'ASC')
        .getMany();

      return allClasses;
    } catch (error) {
      console.error('Error fetching all classes for student:', error);
      return [];
    }
  }

  async getAllClassesForStudentByEmail(email: string): Promise<Class[]> {
    try {
      // Find student by email
      const student = await this.studentRepository.findOne({
        where: { email },
      });

      if (!student) {
        throw new Error('Student not found with email: ' + email);
      }

      // Use the existing method with the student ID
      return await this.getAllClassesForStudent(student.id);
    } catch (error) {
      console.error('Error fetching all classes for student by email:', error);
      return [];
    }
  }

  async getStudentClassesWithPaymentStatus(studentId: number): Promise<any[]> {
    try {
      // Get all classes the student is enrolled in
      const classes = await this.getAllClassesForStudent(studentId);

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Get payment status for each class
      const classesWithPaymentStatus = await Promise.all(
        classes.map(async (classInfo) => {
          // Check if payment exists for current month
          const payment = await this.paymentRepository.findOne({
            where: {
              studentId,
              classId: classInfo.id,
              month: currentMonth,
              year: currentYear,
            },
          });

          return {
            ...classInfo,
            paymentStatus: payment?.status || 'pending',
            paymentAmount: payment?.amount || classInfo.monthlyFees || 0,
            paymentDate: payment?.paidDate || null,
            paymentId: payment?.id || null,
            monthlyFee: classInfo.monthlyFees || 0,
            currentMonth,
            currentYear,
          };
        }),
      );

      return classesWithPaymentStatus;
    } catch (error) {
      console.error('Error fetching classes with payment status:', error);
      return [];
    }
  }

  async getStudentClassesWithPaymentStatusByEmail(
    email: string,
  ): Promise<any[]> {
    try {
      // Find student by email
      const student = await this.studentRepository.findOne({
        where: { email },
      });

      if (!student) {
        throw new Error('Student not found with email: ' + email);
      }

      // Use the existing method with the student ID
      return await this.getStudentClassesWithPaymentStatus(student.id);
    } catch (error) {
      console.error(
        'Error fetching classes with payment status by email:',
        error,
      );
      return [];
    }
  }
}
