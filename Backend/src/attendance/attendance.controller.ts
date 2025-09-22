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
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Attendance } from './attendance.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('attendance')
// @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
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
  async findAll(): Promise<Attendance[]> {
    return this.attendanceService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Attendance | null> {
    return this.attendanceService.findOne(Number(id));
  }

  @Get('class/:classId')
  async findByClass(@Param('classId') classId: number): Promise<Attendance[]> {
    return this.attendanceService.findByClass(Number(classId));
  }

  @Get('student/:studentId')
  async findByStudent(
    @Param('studentId') studentId: number,
  ): Promise<Attendance[]> {
    return this.attendanceService.findByStudent(Number(studentId));
  }

  @Get('class/:classId/date/:date')
  async findByClassAndDate(
    @Param('classId') classId: number,
    @Param('date') date: string,
  ): Promise<Attendance[]> {
    return this.attendanceService.findByClassAndDate(Number(classId), date);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() att: Partial<Attendance>,
  ): Promise<Attendance | null> {
    return this.attendanceService.update(Number(id), att);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    return this.attendanceService.remove(Number(id));
  }
}
