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

  async update(id: number, updatePaymentDto: UpdatePaymentDto): Promise<Payment | null> {
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
      where: { id: classId } 
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
      ].filter(Boolean);

      return studentSubjects.some(
        (subject) =>
          subject.toLowerCase() === classInfo.subject.toLowerCase()
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

  // Mark payment as paid
  async markAsPaid(studentId: number, classId: number, paidBy: number): Promise<Payment> {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get class info for fee amount
    const classInfo = await this.classRepository.findOne({ 
      where: { id: classId } 
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

  // Get payment history for a student
  async getStudentPaymentHistory(studentId: number): Promise<any[]> {
    const payments = await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('class', 'c', 'payment.classId = c.id')
      .leftJoin('student', 's', 'payment.studentId = s.id')
      .select([
        'payment.id as paymentId',
        'payment.amount as amount',
        'payment.month as month',
        'payment.year as year',
        'payment.status as status',
        'payment.paidDate as paidDate',
        'payment.notes as notes',
        'c.subject as subject',
        's.name as studentName',
      ])
      .where('payment.studentId = :studentId', { studentId })
      .orderBy('payment.year', 'DESC')
      .addOrderBy('payment.month', 'DESC')
      .getRawMany();

    return payments;
  }
}