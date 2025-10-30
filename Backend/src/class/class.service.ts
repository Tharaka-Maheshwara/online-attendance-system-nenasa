import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './class.entity';
import { Student } from '../student/student.entity';
import { Attendance } from '../attendance/attendance.entity';
import PDFDocument from 'pdfkit';

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

  async generateClassesPdf(): Promise<Buffer> {
    const classes = await this.getAllClassesWithStudentCount();

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
        doc.fontSize(16).text('Classes Report', { align: 'center' });
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
          .text(`Total Classes: ${classes.length}`, { align: 'left' });
        doc.moveDown(1);

        // Table headers
        const tableTop = doc.y;
        const colWidths = {
          no: 30,
          subject: 100,
          teacher: 90,
          grade: 40,
          day: 60,
          time: 70,
          fee: 60,
          students: 50,
        };

        doc.fontSize(9).font('Helvetica-Bold');
        let xPos = 50;

        doc.text('No', xPos, tableTop, {
          width: colWidths.no,
          align: 'center',
        });
        xPos += colWidths.no;

        doc.text('Subject', xPos, tableTop, {
          width: colWidths.subject,
          align: 'left',
        });
        xPos += colWidths.subject;

        doc.text('Teacher', xPos, tableTop, {
          width: colWidths.teacher,
          align: 'left',
        });
        xPos += colWidths.teacher;

        doc.text('Grade', xPos, tableTop, {
          width: colWidths.grade,
          align: 'center',
        });
        xPos += colWidths.grade;

        doc.text('Day', xPos, tableTop, {
          width: colWidths.day,
          align: 'left',
        });
        xPos += colWidths.day;

        doc.text('Time', xPos, tableTop, {
          width: colWidths.time,
          align: 'left',
        });
        xPos += colWidths.time;

        doc.text('Fee (Rs)', xPos, tableTop, {
          width: colWidths.fee,
          align: 'right',
        });
        xPos += colWidths.fee;

        doc.text('Students', xPos, tableTop, {
          width: colWidths.students,
          align: 'center',
        });

        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.3);

        // Table rows
        doc.font('Helvetica').fontSize(8);

        classes.forEach((cls, index) => {
          const rowY = doc.y;

          // Check if we need a new page
          if (rowY > 700) {
            doc.addPage();
            doc.fontSize(8).font('Helvetica');
          }

          xPos = 50;
          const rowHeight = 20;

          // No
          doc.text((index + 1).toString(), xPos, rowY, {
            width: colWidths.no,
            align: 'center',
            height: rowHeight,
          });
          xPos += colWidths.no;

          // Subject
          doc.text(cls.subject || 'N/A', xPos, rowY, {
            width: colWidths.subject,
            align: 'left',
            height: rowHeight,
          });
          xPos += colWidths.subject;

          // Teacher
          doc.text(cls.teacherName || 'N/A', xPos, rowY, {
            width: colWidths.teacher,
            align: 'left',
            height: rowHeight,
          });
          xPos += colWidths.teacher;

          // Grade
          doc.text(cls.grade?.toString() || 'N/A', xPos, rowY, {
            width: colWidths.grade,
            align: 'center',
            height: rowHeight,
          });
          xPos += colWidths.grade;

          // Day
          doc.text(cls.dayOfWeek || 'N/A', xPos, rowY, {
            width: colWidths.day,
            align: 'left',
            height: rowHeight,
          });
          xPos += colWidths.day;

          // Time
          const timeStr = `${cls.startTime || ''} - ${cls.endTime || ''}`;
          doc.text(timeStr, xPos, rowY, {
            width: colWidths.time,
            align: 'left',
            height: rowHeight,
          });
          xPos += colWidths.time;

          // Fee
          doc.text(cls.monthlyFees?.toLocaleString() || '0', xPos, rowY, {
            width: colWidths.fee,
            align: 'right',
            height: rowHeight,
          });
          xPos += colWidths.fee;

          // Students
          doc.text(cls.enrolledStudents?.toString() || '0', xPos, rowY, {
            width: colWidths.students,
            align: 'center',
            height: rowHeight,
          });

          doc.moveDown(1);
        });

        // Footer
        doc.moveDown(2);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);

        // Calculate totals
        const totalStudents = classes.reduce(
          (sum, cls) => sum + (cls.enrolledStudents || 0),
          0,
        );

        doc.fontSize(9).font('Helvetica-Bold');
        doc.text(`Total Enrolled Students: ${totalStudents}`, 50, doc.y);

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
