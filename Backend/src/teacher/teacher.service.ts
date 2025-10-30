import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './teacher.entity';
import { Class } from '../class/class.entity';
import { Student } from '../student/student.entity';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { UserService } from '../user/user.service';
import PDFDocument from 'pdfkit';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
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

    // Create or update user in nenasa_users table with teacher role
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

  async getTodayClasses(teacherId: number): Promise<any[]> {
    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const today = new Date();
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const todayName = dayNames[today.getDay()];

    // First, find the teacher to get their name
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
    });
    if (!teacher) {
      return []; // Or throw an error
    }

    // Find all classes for this teacher on today's day
    const classes = await this.classRepository.find({
      where: {
        teacherName: teacher.name, // Use teacher's name
        dayOfWeek: todayName,
      },
      order: {
        startTime: 'ASC',
      },
    });

    // Add enrolled student count to each class
    const classesWithCount = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await this.getEnrolledStudentsCount(cls);
        return {
          ...cls,
          enrolledStudents: studentCount,
        };
      }),
    );

    return classesWithCount;
  }

  private async getEnrolledStudentsCount(cls: Class): Promise<number> {
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

  async generateTeachersPdf(): Promise<Buffer> {
    const teachers = await this.findAll();

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('Nenasa Online Attendance System', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(16).text('Teachers Report', { align: 'center' });
        doc.moveDown(0.3);
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Generated on: ${new Date().toLocaleString()}`, {
            align: 'center',
          });
        doc.moveDown(1);

        // Draw line
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1);

        // Summary
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(`Total Teachers: ${teachers.length}`, { align: 'left' });
        doc.moveDown(1);

        // Table headers
        const tableTop = doc.y;
        const colWidths = {
          no: 30,
          id: 50,
          name: 110,
          email: 140,
          contact: 80,
          subjects: 135,
        };

        doc.fontSize(9).font('Helvetica-Bold');
        let xPos = 50;

        doc.text('No', xPos, tableTop, {
          width: colWidths.no,
          align: 'center',
        });
        xPos += colWidths.no;

        doc.text('Teacher ID', xPos, tableTop, {
          width: colWidths.id,
          align: 'left',
        });
        xPos += colWidths.id;

        doc.text('Name', xPos, tableTop, { width: colWidths.name, align: 'left' });
        xPos += colWidths.name;

        doc.text('Email', xPos, tableTop, {
          width: colWidths.email,
          align: 'left',
        });
        xPos += colWidths.email;

        doc.text('Contact', xPos, tableTop, {
          width: colWidths.contact,
          align: 'left',
        });
        xPos += colWidths.contact;

        doc.text('Subjects', xPos, tableTop, {
          width: colWidths.subjects,
          align: 'left',
        });

        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.3);

        // Table rows
        doc.font('Helvetica').fontSize(8);

        teachers.forEach((teacher, index) => {
          const rowY = doc.y;

          // Check if we need a new page
          if (rowY > 700) {
            doc.addPage();
            doc.fontSize(8).font('Helvetica');
          }

          xPos = 50;
          const rowHeight = 25;

          // No
          doc.text((index + 1).toString(), xPos, rowY, {
            width: colWidths.no,
            align: 'center',
            height: rowHeight,
          });
          xPos += colWidths.no;

          // Teacher ID
          doc.text(teacher.registerNumber || 'N/A', xPos, rowY, {
            width: colWidths.id,
            align: 'left',
            height: rowHeight,
          });
          xPos += colWidths.id;

          // Name
          doc.text(teacher.name || 'N/A', xPos, rowY, {
            width: colWidths.name,
            align: 'left',
            height: rowHeight,
          });
          xPos += colWidths.name;

          // Email
          doc.text(teacher.email || 'N/A', xPos, rowY, {
            width: colWidths.email,
            align: 'left',
            height: rowHeight,
          });
          xPos += colWidths.email;

          // Contact
          doc.text(teacher.contactNumber || 'N/A', xPos, rowY, {
            width: colWidths.contact,
            align: 'left',
            height: rowHeight,
          });
          xPos += colWidths.contact;

          // Subjects
          const subjects = [
            teacher.sub_01,
            teacher.sub_02,
            teacher.sub_03,
            teacher.sub_04,
          ]
            .filter(Boolean)
            .join(', ');
          doc.text(subjects || 'No subjects', xPos, rowY, {
            width: colWidths.subjects,
            align: 'left',
            height: rowHeight,
          });

          doc.moveDown(1.2);
        });

        // Footer
        doc.moveDown(2);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);

        // Page numbers
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc
            .fontSize(8)
            .font('Helvetica')
            .text(`Page ${i + 1} of ${pages.count}`, 50, doc.page.height - 50, {
              align: 'center',
            });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
