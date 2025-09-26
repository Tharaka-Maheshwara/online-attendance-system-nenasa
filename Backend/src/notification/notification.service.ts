import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationStatus,
} from './notification.entity';
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
    const sendgridApiKey = this.configService.get('SENDGRID_API_KEY');
    const emailHost = this.configService.get('EMAIL_HOST');
    const emailUser = this.configService.get('EMAIL_USER');
    const emailPass = this.configService.get('EMAIL_PASS');

    if (sendgridApiKey) {
      // Configure SendGrid transporter
      this.transporter = nodemailer.createTransport(
        sendgridTransport({
          auth: {
            api_key: sendgridApiKey,
          },
        }),
      );
      this.logger.log('Email transporter initialized with SendGrid');
    } else if (emailHost && emailUser && emailPass) {
      // Configure SMTP transporter (Gmail, etc.)
      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: parseInt(this.configService.get('EMAIL_PORT') || '587'),
        secure: this.configService.get('EMAIL_PORT') === '465', // true for 465, false for other ports
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });
      this.logger.log('Email transporter initialized with SMTP');
    } else {
      this.logger.warn(
        'No email configuration found. Email notifications will not work.',
      );
    }
  }

  async sendAttendanceNotification(
    studentName: string,
    parentEmail: string,
    classId: number,
    studentId: number,
    isPresent: boolean,
    date: string,
  ): Promise<void> {
    const subject = isPresent
      ? `✅ Attendance Confirmation - ${studentName}`
      : `⚠️ Attendance Alert - ${studentName} Absent`;

    const htmlMessage = this.createAttendanceEmailTemplate(
      studentName,
      isPresent,
      date,
      classId,
    );

    const textMessage = isPresent
      ? `Dear Parent,\n\nYour child ${studentName} was marked PRESENT in class today (${date}).\n\nClass ID: ${classId}\nTime: ${new Date().toLocaleString()}\n\nBest regards,\nNenasala Attendance System`
      : `Dear Parent,\n\nYour child ${studentName} was marked ABSENT from class today (${date}).\n\nClass ID: ${classId}\nTime: ${new Date().toLocaleString()}\n\nPlease contact the school if this is unexpected.\n\nBest regards,\nNenasala Attendance System`;

    try {
      await this.sendEmail(parentEmail, subject, textMessage, htmlMessage);

      // Log the notification
      await this.logNotification({
        recipientEmail: parentEmail,
        subject,
        message: textMessage,
        type: 'email',
        status: 'sent',
        studentId,
        classId,
      });

      this.logger.log(
        `Attendance notification sent to ${parentEmail} for student ${studentName} - Status: ${isPresent ? 'Present' : 'Absent'}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send notification to ${parentEmail}:`,
        error.message,
      );

      // Log the failed notification
      await this.logNotification({
        recipientEmail: parentEmail,
        subject,
        message: textMessage,
        type: 'email',
        status: 'failed',
        studentId,
        classId,
        errorMessage: error.message,
      });
    }
  }

  private createAttendanceEmailTemplate(
    studentName: string,
    isPresent: boolean,
    date: string,
    classId: number,
  ): string {
    const statusColor = isPresent ? '#28a745' : '#dc3545';
    const statusIcon = isPresent ? '✅' : '⚠️';
    const statusText = isPresent ? 'PRESENT' : 'ABSENT';
    const currentTime = new Date().toLocaleString();

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
            .status { font-size: 24px; font-weight: bold; color: ${statusColor}; margin: 10px 0; }
            .details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .logo { font-size: 20px; font-weight: bold; color: #007bff; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏫 Nenasala Attendance System</div>
                <h2>Attendance Notification</h2>
            </div>
            
            <p>Dear Parent,</p>
            
            <div class="details">
                <p><strong>Student:</strong> ${studentName}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Class ID:</strong> ${classId}</p>
                <p><strong>Time:</strong> ${currentTime}</p>
                <div class="status">${statusIcon} Status: ${statusText}</div>
            </div>
            
            ${
              isPresent
                ? '<p>Your child was marked <strong style="color: #28a745;">PRESENT</strong> in class today.</p>'
                : '<p>Your child was marked <strong style="color: #dc3545;">ABSENT</strong> from class today. Please contact the school if this is unexpected.</p>'
            }
            
            <div class="footer">
                <p>Best regards,<br>Nenasala School Administration</p>
                <p><em>This is an automated message. Please do not reply to this email.</em></p>
            </div>
        </div>
    </body>
    </html>`;
  }

  private async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email transporter not configured');
    }

    const mailOptions = {
      from: `${this.configService.get('EMAIL_FROM_NAME') || 'Nenasala Attendance System'} <${this.configService.get('EMAIL_USER') || 'noreply@nenasala.lk'}>`,
      to,
      subject,
      text,
      html,
    };

    await this.transporter.sendMail(mailOptions);
  }

  private async logNotification(
    notificationData: Partial<Notification>,
  ): Promise<Notification> {
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
      if (!this.transporter) {
        this.logger.error('Email transporter not configured');
        return false;
      }
      await this.transporter.verify();
      this.logger.log('Email connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error('Email connection failed:', error.message);
      return false;
    }
  }

  async sendTestEmail(toEmail: string): Promise<boolean> {
    try {
      const subject = 'Test Email - Nenasala Attendance System';
      const textMessage =
        'This is a test email from the Nenasala Attendance System. If you received this, email configuration is working correctly.';
      const htmlMessage = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #007bff;">🏫 Nenasala Attendance System</h2>
          <p>This is a test email to verify email configuration.</p>
          <p><strong>Status:</strong> ✅ Email system is working correctly!</p>
          <p>Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `;

      await this.sendEmail(toEmail, subject, textMessage, htmlMessage);
      this.logger.log(`Test email sent successfully to ${toEmail}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send test email to ${toEmail}:`,
        error.message,
      );
      return false;
    }
  }

  async sendBulkAttendanceNotifications(
    attendanceRecords: Array<{
      studentName: string;
      parentEmail: string;
      classId: number;
      studentId: number;
      isPresent: boolean;
      date: string;
    }>,
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const record of attendanceRecords) {
      try {
        await this.sendAttendanceNotification(
          record.studentName,
          record.parentEmail,
          record.classId,
          record.studentId,
          record.isPresent,
          record.date,
        );
        sent++;
      } catch (error) {
        failed++;
        this.logger.error(
          `Failed to send notification for student ${record.studentName}:`,
          error.message,
        );
      }
    }

    this.logger.log(
      `Bulk notification completed: ${sent} sent, ${failed} failed`,
    );
    return { sent, failed };
  }
}
