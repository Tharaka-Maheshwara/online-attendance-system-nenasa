import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './attendance.entity';
import { NotificationService } from '../notification/notification.service';
import { User } from '../user/user.entity';
import { Student } from '../student/student.entity';
import { Class } from '../class/class.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(att: Partial<Attendance>): Promise<Attendance> {
    console.log('📝 Creating attendance record:', att);
    const attendance = await this.attendanceRepository.save(att);
    console.log('✅ Attendance saved with ID:', attendance.id);

    // Send notification after attendance is marked
    console.log(
      '📧 Attempting to send notification for attendance ID:',
      attendance.id,
    );
    await this.sendAttendanceNotification(attendance);

    return attendance;
  }

  async findAll(): Promise<Attendance[]> {
    return this.attendanceRepository.find();
  }

  async findOne(id: number): Promise<Attendance | null> {
    return this.attendanceRepository.findOne({ where: { id } });
  }

  async update(
    id: number,
    att: Partial<Attendance>,
  ): Promise<Attendance | null> {
    await this.attendanceRepository.update(id, att);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.attendanceRepository.delete(id);
  }

  async findByClass(classId: number): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: { classId },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async findByStudent(studentId: number): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: { studentId },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async findByClassAndDate(
    classId: number,
    date: string,
  ): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: { classId, date },
      order: { createdAt: 'DESC' },
    });
  }

  async getAttendanceWithStudentAndClassDetails(): Promise<any[]> {
    try {
      // Use TypeORM query builder for better database compatibility
      const result = await this.attendanceRepository
        .createQueryBuilder('a')
        .leftJoin('student', 's', 'a.studentId = s.id')
        .leftJoin('class', 'c', 'a.classId = c.id')
        .leftJoin('nenasala_users', 'u', 'a.markedBy = u.id')
        .select([
          'a.id as id',
          'a.studentId as studentId',
          'a.classId as classId',
          'a.date as date',
          'a.status as status',
          'a.timestamp as timestamp',
          'a.method as method',
          'a.markedBy as markedBy',
          'a.createdAt as createdAt',
          's.name as studentName',
          's.email as studentEmail',
          's.registerNumber as studentRegisterNumber',
          'c.name as className',
          'c.subject as classSubject',
          'u.display_name as markedByName',
        ])
        .orderBy('a.date', 'DESC')
        .addOrderBy('a.createdAt', 'DESC')
        .getRawMany();

      return result;
    } catch (error) {
      console.error('Error in getAttendanceWithStudentAndClassDetails:', error);
      throw error;
    }
  }

  async getAttendanceByStudentWithClassDetails(
    studentId: number,
  ): Promise<any[]> {
    try {
      console.log(`Fetching attendance for student ID: ${studentId}`);

      // First, let's get just the attendance records for the student
      const attendanceRecords = await this.attendanceRepository.find({
        where: { studentId },
        order: { date: 'DESC', createdAt: 'DESC' },
      });

      console.log(`Found ${attendanceRecords.length} attendance records`);

      if (attendanceRecords.length === 0) {
        return [];
      }

      // Then fetch additional data for each record
      const enrichedRecords = await Promise.all(
        attendanceRecords.map(async (record) => {
          let studentInfo: Student | null = null;
          let classInfo: Class | null = null;
          let markedByInfo: User | null = null;

          try {
            // Get student info
            if (record.studentId) {
              studentInfo = await this.studentRepository.findOne({
                where: { id: record.studentId },
              });
            }

            // Get class info
            if (record.classId) {
              classInfo = await this.classRepository.findOne({
                where: { id: record.classId },
              });
            }

            // Get marked by info
            if (record.markedBy) {
              markedByInfo = await this.userRepository.findOne({
                where: { id: record.markedBy },
              });
            }
          } catch (fetchError) {
            console.error(
              'Error fetching related data for record:',
              record.id,
              fetchError,
            );
            // Don't throw, continue with null values
          }

          return {
            id: record.id,
            studentId: record.studentId,
            classId: record.classId,
            date: record.date,
            status: record.status,
            timestamp: record.timestamp,
            method: record.method || 'manual',
            markedBy: record.markedBy,
            createdAt: record.createdAt,
            studentName: studentInfo?.name || 'Unknown Student',
            studentEmail: studentInfo?.email || '',
            studentRegisterNumber: studentInfo?.registerNumber || '',
            className: classInfo?.subject || 'Unknown Class',
            classSubject: classInfo?.subject || '',
            markedByName: markedByInfo?.display_name || 'System',
          };
        }),
      );

      console.log(`Returning ${enrichedRecords.length} enriched records`);
      return enrichedRecords;
    } catch (error) {
      console.error('Error in getAttendanceByStudentWithClassDetails:', error);
      // Return empty array instead of throwing to prevent 500 error
      return [];
    }
  }

  private async sendAttendanceNotification(
    attendance: Attendance,
  ): Promise<void> {
    try {
      let studentName: string = 'Student';
      let parentEmail: string = '';

      // First try to get student information from User entity
      const user = await this.userRepository.findOne({
        where: { id: attendance.studentId },
      });

      if (user && user.parentEmail) {
        studentName = user.display_name || 'Student';
        parentEmail = user.parentEmail;
      } else {
        // If not found in User entity, try Student entity
        const student = await this.studentRepository.findOne({
          where: { id: attendance.studentId },
        });

        if (student && student.parentEmail) {
          studentName = student.name || 'Student';
          parentEmail = student.parentEmail;
        }
      }

      if (!parentEmail) {
        console.log(
          `No parent email found for student ID: ${attendance.studentId} in both User and Student entities`,
        );
        return;
      }

      console.log(
        `📨 Sending attendance notification to ${parentEmail} for student ${studentName}`,
      );
      console.log(
        `📊 Attendance details - Status: ${attendance.status}, Date: ${attendance.date}, Class: ${attendance.classId}`,
      );

      // Send notification
      await this.notificationService.sendAttendanceNotification(
        studentName,
        parentEmail,
        attendance.classId,
        attendance.studentId,
        attendance.status === 'present',
        attendance.date,
      );

      console.log('✅ Email notification sent successfully!');
    } catch (error) {
      console.error('Error sending attendance notification:', error);
    }
  }

  async markAbsentStudents(
    classId: number,
    date: string,
    presentStudentIds: number[],
  ): Promise<void> {
    // Get all students in the class
    const allStudents = await this.userRepository.find({
      where: { role: 'student' },
      // You might need to add class relationship here based on your data model
    });

    // Find absent students
    const absentStudents = allStudents.filter(
      (student) => !presentStudentIds.includes(student.id),
    );

    // Mark absent and send notifications
    for (const student of absentStudents) {
      const existingAttendance = await this.attendanceRepository.findOne({
        where: { studentId: student.id, classId, date },
      });

      if (!existingAttendance) {
        // Create absent attendance record
        const absentAttendance = await this.attendanceRepository.save({
          studentId: student.id,
          classId,
          date,
          status: 'absent',
          markedAt: new Date(),
        });

        // Send notification for absent student
        await this.sendAttendanceNotification(absentAttendance);
      }
    }
  }
}
