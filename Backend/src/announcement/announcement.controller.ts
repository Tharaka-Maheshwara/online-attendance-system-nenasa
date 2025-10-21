import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MockAuthGuard } from '../auth/mock-auth.guard';
import { AnnouncementService } from './announcement.service';
import type { CreateAnnouncementDto } from './announcement.service';

@Controller('announcements')
@UseGuards(MockAuthGuard) // Temporarily using mock auth
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post('send')
  async sendAnnouncement(
    @Body() createAnnouncementDto: CreateAnnouncementDto,
    @Request() req,
  ) {
    try {
      // Validate teacher email from token
      const userEmail = req.user?.email || req.user?.upn;
      if (!userEmail) {
        throw new HttpException(
          'User email not found in token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Use email from token instead of request body for security
      const announcementData = {
        ...createAnnouncementDto,
        teacherEmail: userEmail,
      };

      const announcement =
        await this.announcementService.createAnnouncement(announcementData);

      return {
        success: true,
        message: 'Announcement sent successfully',
        data: {
          id: announcement.id,
          title: announcement.title,
          recipientCount: announcement.recipientCount,
          createdAt: announcement.createdAt,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to send announcement',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('teacher')
  async getTeacherAnnouncements(@Request() req) {
    try {
      const userEmail = req.user?.email || req.user?.upn;
      if (!userEmail) {
        throw new HttpException(
          'User email not found in token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const announcements =
        await this.announcementService.getAnnouncementsByTeacher(userEmail);

      // Add class information to each announcement
      const announcementsWithClassInfo = announcements.map((announcement) => ({
        ...announcement,
        className: `Class ${announcement.classId}`, // You can enhance this with actual class name lookup
      }));

      return {
        success: true,
        data: announcementsWithClassInfo,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch announcements',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('student/:studentId')
  async getStudentAnnouncements(@Param('studentId') studentId: number) {
    try {
      const announcements =
        await this.announcementService.getAnnouncementsForStudent(studentId);

      return {
        success: true,
        data: announcements,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch student announcements',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('all')
  async getAllAnnouncements() {
    try {
      const announcements =
        await this.announcementService.getAllAnnouncements();

      return {
        success: true,
        data: announcements,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch all announcements',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  async getAnnouncementStats(@Request() req) {
    try {
      const userEmail = req.user?.email || req.user?.upn;
      const stats =
        await this.announcementService.getAnnouncementStats(userEmail);

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch announcement stats',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getAnnouncementById(@Param('id') id: number) {
    try {
      const announcement =
        await this.announcementService.getAnnouncementById(id);

      return {
        success: true,
        data: announcement,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch announcement',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteAnnouncement(@Param('id') id: number, @Request() req) {
    try {
      const userEmail = req.user?.email || req.user?.upn;
      if (!userEmail) {
        throw new HttpException(
          'User email not found in token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      await this.announcementService.deleteAnnouncement(id, userEmail);

      return {
        success: true,
        message: 'Announcement deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to delete announcement',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
