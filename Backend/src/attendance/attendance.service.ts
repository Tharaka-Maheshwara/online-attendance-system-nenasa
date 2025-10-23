import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './attendance.entity';
import { NotificationService } from '../notification/notification.service';
import { User } from '../user/user.entity';
import { Student } from '../student/student.entity';
import { Class } from '../class/class.entity';
import { Payment } from '../payment/payment.entity';

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
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly notificationService: NotificationService,
  ) {}

  async getAvailableGrades(): Promise<number[]> {
    try {
      const grades = await this.classRepository
        .createQueryBuilder('class')
        .select('DISTINCT class.grade', 'grade')
        .where('class.grade IS NOT NULL')
        .orderBy('class.grade', 'ASC')
        .getRawMany();

      return grades.map((g) => g.grade).filter((grade) => grade !== null);
    } catch (error) {
      console.error('Error fetching available grades:', error);
      return [];
    }
  }

  async getClassesByGrade(grade: number): Promise<any[]> {
    try {
      const classes = await this.classRepository.find({
        where: { grade },
        order: { subject: 'ASC' },
      });

      return classes;
    } catch (error) {
      console.error('Error fetching classes by grade:', error);
      return [];
    }
  }

  async getAllClassesWithGrades(): Promise<any[]> {
    try {
      const classes = await this.classRepository.find({
        order: { grade: 'ASC', subject: 'ASC' },
      });

      // Group classes by grade for easier frontend consumption
      const classesGrouped = classes.reduce((acc, classItem) => {
        const grade = classItem.grade || 0;
        if (!acc[grade]) {
          acc[grade] = [];
        }
        acc[grade].push({
          id: classItem.id,
          subject: classItem.subject,
          teacherName: classItem.teacherName,
          teacherId: classItem.teacherId,
          dayOfWeek: classItem.dayOfWeek,
          startTime: classItem.startTime,
          endTime: classItem.endTime,
          monthlyFees: classItem.monthlyFees,
        });
        return acc;
      }, {} as any);

      // Convert to array format
      return Object.keys(classesGrouped).map((grade) => ({
        grade: Number(grade),
        classes: classesGrouped[grade],
      }));
    } catch (error) {
      console.error('Error fetching all classes with grades:', error);
      return [];
    }
  }

  async create(att: Partial<Attendance>): Promise<Attendance> {
    console.log('📝 Creating/Updating attendance record:', att);

    // Check if attendance record already exists for the same student, class, and date
    const existingRecord = await this.attendanceRepository.findOne({
      where: {
        studentId: att.studentId,
        classId: att.classId,
        date: att.date,
      },
    });

    let attendance: Attendance;

    if (existingRecord) {
      // Update existing record
      console.log('📄 Found existing record, updating:', existingRecord.id);

      // Update the existing record with new data
      await this.attendanceRepository.update(existingRecord.id, {
        status: att.status,
        isPresent: att.isPresent,
        timestamp: att.timestamp || new Date(),
        method: att.method,
        markedBy: att.markedBy,
        grade: att.grade,
        subject: att.subject,
      });

      // Fetch the updated record
      const updatedRecord = await this.attendanceRepository.findOne({
        where: { id: existingRecord.id },
      });

      if (!updatedRecord) {
        throw new Error('Failed to fetch updated attendance record');
      }

      attendance = updatedRecord;
      console.log('✅ Attendance updated with ID:', attendance.id);
    } else {
      // Create new record
      console.log('📝 No existing record found, creating new one');
      attendance = await this.attendanceRepository.save(att);
      console.log('✅ New attendance saved with ID:', attendance.id);
    }

    // Send notification after attendance is marked/updated
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

  // ===== NEW ATTENDANCE ANALYSIS METHODS =====

  /**
   * Get students registered for a specific grade and subject
   */
  async getStudentsByGradeAndSubject(
    grade: number,
    subject: string,
  ): Promise<any[]> {
    try {
      const students = await this.studentRepository.find({
        where: { grade },
      });

      // Filter students who are registered for the specific subject
      const filteredStudents = students.filter((student) => {
        const studentSubjects = [
          student.sub_1,
          student.sub_2,
          student.sub_3,
          student.sub_4,
          student.sub_5,
          student.sub_6,
        ].filter(Boolean);

        return studentSubjects.some(
          (subjectName) => subjectName?.toLowerCase() === subject.toLowerCase(),
        );
      });

      return filteredStudents.map((student) => ({
        id: student.id,
        name: student.name,
        email: student.email,
        registerNumber: student.registerNumber,
        grade: student.grade,
        subjects: [
          student.sub_1,
          student.sub_2,
          student.sub_3,
          student.sub_4,
          student.sub_5,
          student.sub_6,
        ].filter(Boolean),
      }));
    } catch (error) {
      console.error('Error fetching students by grade and subject:', error);
      return [];
    }
  }

  /**
   * Get attendance analysis for students in a specific grade and subject
   */
  async getAttendanceAnalysisByGradeAndSubject(
    grade: number,
    subject: string,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    try {
      // Get students for this grade and subject
      const students = await this.getStudentsByGradeAndSubject(grade, subject);

      if (students.length === 0) {
        return {
          students: [],
          chartData: [],
          summary: {
            totalStudents: 0,
            totalClasses: 0,
            overallAttendanceRate: 0,
          },
        };
      }

      // Get class information for this grade and subject
      const classInfo = await this.classRepository.findOne({
        where: { grade, subject },
      });

      if (!classInfo) {
        return {
          students: [],
          chartData: [],
          summary: {
            totalStudents: students.length,
            totalClasses: 0,
            overallAttendanceRate: 0,
          },
        };
      }

      // Build attendance query
      let query = this.attendanceRepository
        .createQueryBuilder('a')
        .where('a.grade = :grade', { grade })
        .andWhere('a.subject = :subject', { subject });

      if (startDate && endDate) {
        query = query.andWhere('a.date BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      } else if (startDate) {
        query = query.andWhere('a.date >= :startDate', { startDate });
      } else if (endDate) {
        query = query.andWhere('a.date <= :endDate', { endDate });
      }

      const attendanceRecords = await query.orderBy('a.date', 'DESC').getMany();

      // Calculate attendance statistics for each student
      const studentAnalysis = students.map((student) => {
        const studentAttendances = attendanceRecords.filter(
          (record) => record.studentId === student.id,
        );

        const totalClasses = studentAttendances.length;
        const presentCount = studentAttendances.filter(
          (record) => record.status === 'present',
        ).length;
        const absentCount = studentAttendances.filter(
          (record) => record.status === 'absent',
        ).length;
        const lateCount = studentAttendances.filter(
          (record) => record.status === 'late',
        ).length;

        const attendanceRate =
          totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

        return {
          ...student,
          attendanceStats: {
            totalClasses,
            presentCount,
            absentCount,
            lateCount,
            attendanceRate: Number(attendanceRate.toFixed(2)),
          },
          recentAttendance: studentAttendances.slice(0, 10), // Last 10 records
        };
      });

      // Generate chart data
      const chartData = this.generateAttendanceChartData(
        attendanceRecords,
        students,
      );

      // Calculate overall summary
      const totalClasses = attendanceRecords.length;
      const totalPresent = attendanceRecords.filter(
        (r) => r.status === 'present',
      ).length;
      const overallAttendanceRate =
        totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;

      return {
        students: studentAnalysis,
        chartData,
        summary: {
          totalStudents: students.length,
          totalClasses: totalClasses,
          overallAttendanceRate: Number(overallAttendanceRate.toFixed(2)),
          classInfo: {
            id: classInfo.id,
            subject: classInfo.subject,
            grade: classInfo.grade,
            teacherName: classInfo.teacherName,
            monthlyFees: classInfo.monthlyFees,
          },
        },
      };
    } catch (error) {
      console.error('Error in attendance analysis:', error);
      throw error;
    }
  }

  /**
   * Generate chart data for attendance visualization
   */
  private generateAttendanceChartData(
    attendanceRecords: Attendance[],
    students: any[],
  ): any[] {
    // Group by date
    const dateGroups = attendanceRecords.reduce((acc, record) => {
      if (!acc[record.date]) {
        acc[record.date] = {
          date: record.date,
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
        };
      }

      acc[record.date][record.status]++;
      acc[record.date].total++;

      return acc;
    }, {} as any);

    // Convert to array and sort by date
    return Object.values(dateGroups).sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }

  /**
   * Get attendance analysis with time-based filtering (week, month, year)
   */
  async getAttendanceAnalysisByTimeRange(
    grade: number,
    subject: string,
    timeRange: 'week' | 'month' | 'year',
    customStartDate?: string,
    customEndDate?: string,
  ): Promise<any> {
    try {
      let startDate: string;
      let endDate: string;

      if (customStartDate && customEndDate) {
        startDate = customStartDate;
        endDate = customEndDate;
      } else {
        const now = new Date();

        switch (timeRange) {
          case 'week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)

            startDate = weekStart.toISOString().split('T')[0];
            endDate = weekEnd.toISOString().split('T')[0];
            break;

          case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            startDate = monthStart.toISOString().split('T')[0];
            endDate = monthEnd.toISOString().split('T')[0];
            break;

          case 'year':
            const yearStart = new Date(now.getFullYear(), 0, 1);
            const yearEnd = new Date(now.getFullYear(), 11, 31);

            startDate = yearStart.toISOString().split('T')[0];
            endDate = yearEnd.toISOString().split('T')[0];
            break;

          default:
            throw new Error('Invalid time range');
        }
      }

      const analysis = await this.getAttendanceAnalysisByGradeAndSubject(
        grade,
        subject,
        startDate,
        endDate,
      );

      return {
        ...analysis,
        timeRange: {
          type: timeRange,
          startDate,
          endDate,
        },
      };
    } catch (error) {
      console.error('Error in time-based attendance analysis:', error);
      throw error;
    }
  }

  /**
   * Get payment status for students in a grade and subject
   */
  async getPaymentStatusByGradeAndSubject(
    grade: number,
    subject: string,
    month?: number,
    year?: number,
  ): Promise<any[]> {
    try {
      // Get students for this grade and subject
      const students = await this.getStudentsByGradeAndSubject(grade, subject);

      if (students.length === 0) {
        return [];
      }

      // Get class information
      const classInfo = await this.classRepository.findOne({
        where: { grade, subject },
      });

      if (!classInfo) {
        return students.map((student) => ({
          ...student,
          paymentStatus: 'no-class-found',
          monthlyFee: 0,
          paymentDetails: null,
        }));
      }

      // Use current month/year if not provided
      const currentDate = new Date();
      const targetMonth = month || currentDate.getMonth() + 1;
      const targetYear = year || currentDate.getFullYear();

      // Get payment records
      const payments = await this.paymentRepository.find({
        where: {
          classId: classInfo.id,
          month: targetMonth,
          year: targetYear,
        },
      });

      // Map payment status to students
      return students.map((student) => {
        const payment = payments.find((p) => p.studentId === student.id);

        return {
          ...student,
          paymentStatus: payment?.status || 'pending',
          monthlyFee: classInfo.monthlyFees || 0,
          paymentDetails: payment
            ? {
                id: payment.id,
                amount: payment.amount,
                month: payment.month,
                year: payment.year,
                paidDate: payment.paidDate,
                notes: payment.notes,
              }
            : null,
        };
      });
    } catch (error) {
      console.error('Error fetching payment status:', error);
      return [];
    }
  }

  /**
   * Get comprehensive attendance and payment analysis
   */
  async getComprehensiveAnalysis(
    grade: number,
    subject: string,
    timeRange: 'week' | 'month' | 'year' = 'month',
    customStartDate?: string,
    customEndDate?: string,
  ): Promise<any> {
    try {
      // Get attendance analysis
      const attendanceAnalysis = await this.getAttendanceAnalysisByTimeRange(
        grade,
        subject,
        timeRange,
        customStartDate,
        customEndDate,
      );

      // Get payment status
      const paymentStatus = await this.getPaymentStatusByGradeAndSubject(
        grade,
        subject,
      );

      // Merge attendance and payment data
      const studentsWithCompleteData = attendanceAnalysis.students.map(
        (student: any) => {
          const paymentInfo = paymentStatus.find((p) => p.id === student.id);

          return {
            ...student,
            paymentStatus: paymentInfo?.paymentStatus || 'pending',
            monthlyFee: paymentInfo?.monthlyFee || 0,
            paymentDetails: paymentInfo?.paymentDetails || null,
          };
        },
      );

      // Calculate payment summary
      const paymentSummary = {
        totalStudents: paymentStatus.length,
        paidStudents: paymentStatus.filter((p) => p.paymentStatus === 'paid')
          .length,
        pendingStudents: paymentStatus.filter(
          (p) => p.paymentStatus === 'pending',
        ).length,
        overdueStudents: paymentStatus.filter(
          (p) => p.paymentStatus === 'overdue',
        ).length,
        totalMonthlyRevenue: paymentStatus.reduce(
          (sum, p) => sum + (p.monthlyFee || 0),
          0,
        ),
        collectedRevenue: paymentStatus
          .filter((p) => p.paymentStatus === 'paid')
          .reduce((sum, p) => sum + (p.paymentDetails?.amount || 0), 0),
      };

      return {
        ...attendanceAnalysis,
        students: studentsWithCompleteData,
        paymentSummary,
      };
    } catch (error) {
      console.error('Error in comprehensive analysis:', error);
      throw error;
    }
  }

  /**
   * Get available subjects for a specific grade
   */
  async getSubjectsByGrade(grade: number): Promise<string[]> {
    try {
      const classes = await this.classRepository.find({
        where: { grade },
        select: ['subject'],
      });

      return [...new Set(classes.map((c) => c.subject))].filter(Boolean);
    } catch (error) {
      console.error('Error fetching subjects by grade:', error);
      return [];
    }
  }
}
