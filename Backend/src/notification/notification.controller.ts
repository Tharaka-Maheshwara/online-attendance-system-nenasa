import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification } from './notification.entity';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('history')
  async getNotificationHistory(
    @Query('studentId') studentId?: number,
  ): Promise<Notification[]> {
    return this.notificationService.getNotificationHistory(studentId);
  }

  @Post('test-email')
  async testEmailConnection(): Promise<{ success: boolean; message: string }> {
    const isConnected = await this.notificationService.testEmailConnection();
    return {
      success: isConnected,
      message: isConnected
        ? 'Email connection successful'
        : 'Email connection failed',
    };
  }

  @Post('send-test-email')
  async sendTestEmail(
    @Body('email') email: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!email) {
      return { success: false, message: 'Email address is required' };
    }

    const success = await this.notificationService.sendTestEmail(email);
    return {
      success,
      message: success
        ? 'Test email sent successfully'
        : 'Failed to send test email',
    };
  }

  @Post('send-attendance')
  async sendAttendanceNotification(
    @Body()
    notificationData: {
      studentName: string;
      parentEmail: string;
      classId: number;
      studentId: number;
      isPresent: boolean;
      date: string;
    },
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.notificationService.sendAttendanceNotification(
        notificationData.studentName,
        notificationData.parentEmail,
        notificationData.classId,
        notificationData.studentId,
        notificationData.isPresent,
        notificationData.date,
      );
      return { success: true, message: 'Notification sent successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
