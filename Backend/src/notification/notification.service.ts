import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationStatus } from './notification.entity';
import * as nodemailer from 'nodemailer';
const sendgridTransport = require('nodemailer-sendgrid-transport');
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly configService: ConfigService,
  ) {
    this.initializeEmailTransporter();
  }

  private initializeEmailTransporter() {
    // Configure SendGrid transporter
    this.transporter = nodemailer.createTransport(
      sendgridTransport({
        auth: {
          api_key: this.configService.get('SENDGRID_API_KEY'),
        },
      })
    );
  }

  async sendAttendanceNotification(
    studentName: string,
    parentEmail: string,
    classId: number,
    studentId: number,
    isPresent: boolean,
    date: string
  ): Promise<void> {
    const subject = isPresent 
      ? `Attendance Confirmation - ${studentName}` 
      : `Attendance Alert - ${studentName} Absent`;
    
    const message = isPresent
      ? `Dear Parent,\n\nYour child ${studentName} was marked present in class today (${date}).\n\nBest regards,\nSchool Administration`
      : `Dear Parent,\n\nYour child ${studentName} was marked absent from class today (${date}). Please contact the school if this is unexpected.\n\nBest regards,\nSchool Administration`;

    try {
      await this.sendEmail(parentEmail, subject, message);
      
      // Log the notification
      await this.logNotification({
        recipientEmail: parentEmail,
        subject,
        message,
        type: 'email',
        status: 'sent',
        studentId,
        classId,
      });

      this.logger.log(`Attendance notification sent to ${parentEmail} for student ${studentName}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to ${parentEmail}:`, error.message);
      
      // Log the failed notification
      await this.logNotification({
        recipientEmail: parentEmail,
        subject,
        message,
        type: 'email',
        status: 'failed',
        studentId,
        classId,
        errorMessage: error.message,
      });
    }
  }

  private async sendEmail(to: string, subject: string, text: string): Promise<void> {
    const mailOptions = {
      from: this.configService.get('EMAIL_USER') || 'your-email@gmail.com',
      to,
      subject,
      text,
    };

    await this.transporter.sendMail(mailOptions);
  }

  private async logNotification(notificationData: Partial<Notification>): Promise<Notification> {
    const notification = this.notificationRepository.create(notificationData);
    return this.notificationRepository.save(notification);
  }

  async getNotificationHistory(studentId?: number): Promise<Notification[]> {
    const whereCondition = studentId ? { studentId } : {};
    return this.notificationRepository.find({
      where: whereCondition,
      order: { sentAt: 'DESC' },
    });
  }

  async testEmailConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error('Email connection failed:', error.message);
      return false;
    }
  }
}
