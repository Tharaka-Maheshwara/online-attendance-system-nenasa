import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Class } from '../class/class.entity';
import { Student } from '../student/student.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const payment = this.paymentRepository.create(createPaymentDto);
    return this.paymentRepository.save(payment);
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Payment | null> {
    return this.paymentRepository.findOne({ where: { id } });
  }

  async update(
    id: number,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment | null> {
    await this.paymentRepository.update(id, updatePaymentDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.paymentRepository.delete(id);
  }

  // Get payment status for students in a specific class for current month
  async getPaymentStatusForClass(classId: number): Promise<any[]> {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get class details
    const classInfo = await this.classRepository.findOne({
      where: { id: classId },
    });

    if (!classInfo) {
      throw new Error('Class not found');
    }

    // Get all students
    const allStudents = await this.studentRepository.find();

    // Filter students enrolled in this class
    const enrolledStudents = allStudents.filter((student) => {
      const studentSubjects = [
        student.sub_1,
        student.sub_2,
        student.sub_3,
        student.sub_4,
        student.sub_5,
        student.sub_6,
      ].filter(Boolean);

      return (
        studentSubjects.some(
          (subject) =>
            subject.toLowerCase() === classInfo.subject.toLowerCase(),
        ) && student.grade === classInfo.grade
      );
    });

    // Get payment records for current month
    const payments = await this.paymentRepository.find({
      where: {
        classId,
        month: currentMonth,
        year: currentYear,
      },
    });

    // Create payment status for each student
    const paymentStatuses = enrolledStudents.map((student) => {
      const payment = payments.find((p) => p.studentId === student.id);

      return {
        studentId: student.id,
        studentName: student.name,
        studentRegisterNumber: student.registerNumber,
        classId,
        subject: classInfo.subject,
        monthlyFee: classInfo.monthlyFees || 0,
        month: currentMonth,
        year: currentYear,
        paymentStatus: payment?.status || 'pending',
        paymentId: payment?.id || null,
        paidDate: payment?.paidDate || null,
        notes: payment?.notes || '',
      };
    });

    return paymentStatuses;
  }

  // Check and create new month payment records if needed
  async ensureCurrentMonthPayments(classId: number): Promise<void> {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get class details
    const classInfo = await this.classRepository.findOne({
      where: { id: classId },
    });

    if (!classInfo) {
      return;
    }

    // Get all students
    const allStudents = await this.studentRepository.find();

    // Filter students enrolled in this class
    const enrolledStudents = allStudents.filter((student) => {
      const studentSubjects = [
        student.sub_1,
        student.sub_2,
        student.sub_3,
        student.sub_4,
        student.sub_5,
        student.sub_6,
      ].filter(Boolean);

      return (
        studentSubjects.some(
          (subject) =>
            subject.toLowerCase() === classInfo.subject.toLowerCase(),
        ) && student.grade === classInfo.grade
      );
    });

    // Check if payment records exist for current month
    for (const student of enrolledStudents) {
      const existingPayment = await this.paymentRepository.findOne({
        where: {
          studentId: student.id,
          classId: classId,
          month: currentMonth,
          year: currentYear,
        },
      });

      // Create new pending payment if doesn't exist
      if (!existingPayment) {
        const newPayment = this.paymentRepository.create({
          studentId: student.id,
          classId: classId,
          amount: classInfo.monthlyFees || 0,
          month: currentMonth,
          year: currentYear,
          status: 'pending',
        });

        await this.paymentRepository.save(newPayment);
        console.log(
          `Created new payment record for student ${student.name} (${student.id}) for ${currentMonth}/${currentYear}`,
        );
      }
    }
  }

  // Mark payment as paid
  async markAsPaid(
    studentId: number,
    classId: number,
    paidBy: number,
  ): Promise<Payment> {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get class info for fee amount
    const classInfo = await this.classRepository.findOne({
      where: { id: classId },
    });

    if (!classInfo) {
      throw new Error('Class not found');
    }

    // Check if payment record already exists
    let payment = await this.paymentRepository.findOne({
      where: {
        studentId,
        classId,
        month: currentMonth,
        year: currentYear,
      },
    });

    if (payment) {
      // Update existing payment
      payment.status = 'paid';
      payment.paidDate = currentDate;
      payment.paidBy = paidBy;
    } else {
      // Create new payment record
      payment = this.paymentRepository.create({
        studentId,
        classId,
        amount: classInfo.monthlyFees || 0,
        month: currentMonth,
        year: currentYear,
        status: 'paid',
        paidDate: currentDate,
        paidBy,
      });
    }

    return this.paymentRepository.save(payment);
  }

  // Get payment history for a student with proper class and subject matching
  async getStudentPaymentHistory(studentId: number): Promise<any[]> {
    try {
      console.log(`Fetching payment history for student ${studentId}`);

      // Get all payments for this student
      const payments = await this.paymentRepository.find({
        where: { studentId },
        order: { year: 'DESC', month: 'DESC' },
      });

      console.log(
        `Found ${payments.length} payments for student ${studentId}:`,
        payments,
      );

      // If we have payments, enrich them with class and student info
      const enrichedPayments: any[] = [];

      for (const payment of payments) {
        let classInfo: any = null;
        let studentInfo: any = null;

        try {
          // Get class information for this payment
          classInfo = await this.classRepository.findOne({
            where: { id: payment.classId },
          });
          console.log(`Class info for classId ${payment.classId}:`, classInfo);
        } catch (err) {
          console.error('Could not fetch class info:', err);
        }

        try {
          // Get student information
          studentInfo = await this.studentRepository.findOne({
            where: { id: payment.studentId },
          });
          console.log(
            `Student info for studentId ${payment.studentId}:`,
            studentInfo,
          );
        } catch (err) {
          console.error('Could not fetch student info:', err);
        }

        const enrichedPayment = {
          paymentId: payment.id,
          amount: payment.amount,
          month: payment.month,
          year: payment.year,
          status: payment.status,
          paidDate: payment.paidDate,
          notes: payment.notes,
          classId: payment.classId,
          subject: classInfo?.subject || 'Unknown',
          studentName: studentInfo?.name || 'Unknown',
          grade: classInfo?.grade || null,
          // Add payment status mapping
          isPaid: payment.status === 'paid',
          paymentDate: payment.paidDate,
          paymentMethod: 'Bank Transfer', // Default for now
        };

        enrichedPayments.push(enrichedPayment);
        console.log('Enriched payment:', enrichedPayment);
      }

      return enrichedPayments;
    } catch (error) {
      console.error('Error in getStudentPaymentHistory:', error);
      return [];
    }
  }

  // New method to get payment status for a specific grade and subject
  async getPaymentStatusForGradeAndSubject(
    grade: number,
    subject: string,
  ): Promise<any[]> {
    try {
      console.log(
        `Getting payment status for grade ${grade}, subject ${subject}`,
      );

      // First, find all classes for this grade and subject
      const classes = await this.classRepository.find({
        where: {
          grade: grade,
          subject: subject,
        },
      });

      console.log(
        `Found ${classes.length} classes for grade ${grade}, subject ${subject}:`,
        classes,
      );

      if (classes.length === 0) {
        return [];
      }

      const classIds = classes.map((c) => c.id);
      console.log('Class IDs:', classIds);

      // Get all payments for these classes
      const payments = await this.paymentRepository.find({
        where: {
          classId: classIds.length === 1 ? classIds[0] : (classIds as any), // Handle single or multiple class IDs
        },
        order: { year: 'DESC', month: 'DESC' },
      });

      console.log(
        `Found ${payments.length} payments for these classes:`,
        payments,
      );

      // Enrich with student info
      const paymentStatus: any[] = [];

      for (const payment of payments) {
        try {
          const studentInfo = await this.studentRepository.findOne({
            where: { id: payment.studentId },
          });

          if (studentInfo) {
            paymentStatus.push({
              studentId: payment.studentId,
              studentName: studentInfo.name,
              paymentId: payment.id,
              amount: payment.amount,
              status: payment.status,
              isPaid: payment.status === 'paid',
              paidDate: payment.paidDate,
              classId: payment.classId,
              subject: subject,
              grade: grade,
            });
          }
        } catch (err) {
          console.error(
            `Error getting student info for payment ${payment.id}:`,
            err,
          );
        }
      }

      console.log('Final payment status:', paymentStatus);
      return paymentStatus;
    } catch (error) {
      console.error('Error in getPaymentStatusForGradeAndSubject:', error);
      return [];
    }
  }
}
