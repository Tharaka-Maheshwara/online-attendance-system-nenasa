import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  ForbiddenException,
  Request,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Attendance } from './attendance.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles('teacher', 'admin')
  async create(@Body() attendanceData: any): Promise<any> {
    try {
      // Handle bulk attendance creation
      if (
        attendanceData.attendance &&
        Array.isArray(attendanceData.attendance)
      ) {
        const results: Attendance[] = [];
        for (const record of attendanceData.attendance) {
          const attendance = {
            studentId: record.studentId,
            classId: attendanceData.classId,
            date: attendanceData.date,
            status: record.status,
            timestamp: record.timestamp
              ? new Date(record.timestamp)
              : new Date(),
            isPresent: record.status === 'present',
          };
          const savedAttendance =
            await this.attendanceService.create(attendance);
          results.push(savedAttendance);
        }
        return {
          success: true,
          message: 'Attendance saved successfully',
          data: results,
        };
      } else {
        // Handle single attendance record
        const attendance = await this.attendanceService.create(attendanceData);
        return {
          success: true,
          message: 'Attendance saved successfully',
          data: attendance,
        };
      }
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to save attendance',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @Roles('teacher', 'admin')
  async findAll(): Promise<Attendance[]> {
    return this.attendanceService.findAll();
  }

  @Get(':id')
  @Roles('teacher', 'admin')
  async findOne(@Param('id') id: number): Promise<Attendance | null> {
    return this.attendanceService.findOne(Number(id));
  }

  @Get('class/:classId')
  @Roles('teacher', 'admin')
  async findByClass(@Param('classId') classId: number): Promise<Attendance[]> {
    return this.attendanceService.findByClass(Number(classId));
  }

  @Get('student/:studentId')
  @Roles('teacher', 'admin')
  async findByStudent(
    @Param('studentId') studentId: number,
  ): Promise<Attendance[]> {
    return this.attendanceService.findByStudent(Number(studentId));
  }

  @Get('my-attendance')
  @Roles('student')
  async getMyAttendance(@Request() req): Promise<Attendance[]> {
    const user = req.user;
    return this.attendanceService.findByStudent(user.id);
  }

  @Get('test-role-access')
  async testRoleAccess(@Request() req): Promise<any> {
    const user = req.user;
    return {
      message: 'Access granted',
      userRole: user?.role,
      userId: user?.id,
      allowedActions: {
        canMarkAttendance: ['teacher', 'admin'].includes(user?.role),
        canViewOwnAttendance: user?.role === 'student',
        canViewAllAttendance: ['teacher', 'admin'].includes(user?.role),
        canDeleteAttendance: user?.role === 'admin',
      },
    };
  }

  @Get('class/:classId/date/:date')
  @Roles('teacher', 'admin')
  async findByClassAndDate(
    @Param('classId') classId: number,
    @Param('date') date: string,
  ): Promise<Attendance[]> {
    return this.attendanceService.findByClassAndDate(Number(classId), date);
  }

  @Put(':id')
  @Roles('teacher', 'admin')
  async update(
    @Param('id') id: number,
    @Body() att: Partial<Attendance>,
  ): Promise<Attendance | null> {
    return this.attendanceService.update(Number(id), att);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: number): Promise<void> {
    return this.attendanceService.remove(Number(id));
  }
}
