import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
import {
  AttendanceAnalysisResponseDto,
  ChartDataResponseDto,
  StudentPaymentStatusDto,
} from './dto/attendance-analysis.dto';

@Controller('attendance')
// @UseGuards(JwtAuthGuard, RolesGuard) // Temporarily disabled for testing
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('classes/by-grade/:grade')
  @Roles('teacher', 'admin')
  async getClassesByGrade(@Param('grade') grade: number): Promise<any[]> {
    return this.attendanceService.getClassesByGrade(Number(grade));
  }

  @Get('classes/all-with-grades')
  // @Roles('teacher', 'admin') // Temporarily disabled for testing
  async getAllClassesWithGrades(): Promise<any[]> {
    return this.attendanceService.getAllClassesWithGrades();
  }

  @Get('grades')
  // @Roles('teacher', 'admin') // Temporarily disabled for testing
  async getAvailableGrades(): Promise<number[]> {
    return this.attendanceService.getAvailableGrades();
  }

  @Post()
  // @Roles('teacher', 'admin') // Temporarily disabled for testing
  async create(@Body() attendanceData: any): Promise<any> {
    try {
      // Ensure current month payment records exist for this class
      if (attendanceData.classId) {
        await this.attendanceService.ensureCurrentMonthPaymentsForClass(
          attendanceData.classId,
        );
      }

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
            grade: attendanceData.grade,
            subject: attendanceData.subject,
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
  async findAll(
    @Query('date') date?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('grade') grade?: string,
    @Query('subject') subject?: string,
    @Query('classId') classId?: string,
  ): Promise<Attendance[]> {
    // If no filters provided, return all
    if (!date && !dateFrom && !dateTo && !grade && !subject && !classId) {
      return this.attendanceService.findAll();
    }

    // Build filter object
    const filters: any = {};

    if (date) {
      filters.date = date;
    }

    if (dateFrom && dateTo) {
      filters.dateFrom = dateFrom;
      filters.dateTo = dateTo;
    }

    if (grade) {
      filters.grade = Number(grade);
    }

    if (subject) {
      filters.subject = subject;
    }

    if (classId) {
      filters.classId = Number(classId);
    }

    return this.attendanceService.findWithFilters(filters);
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
  //Get Function to test rolebase-access
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

  @Get('history/all')
  @Roles('admin')
  async getAttendanceHistoryWithDetails(): Promise<any[]> {
    return this.attendanceService.getAttendanceWithStudentAndClassDetails();
  }

  @Get('history/student/:studentId')
  // @Roles('teacher', 'admin') // Temporarily disabled for testing
  async getStudentAttendanceHistory(
    @Param('studentId') studentId: number,
  ): Promise<any[]> {
    try {
      console.log(
        `Controller: Getting attendance history for student ${studentId}`,
      );
      const result =
        await this.attendanceService.getAttendanceByStudentWithClassDetails(
          Number(studentId),
        );
      console.log(`Controller: Returning ${result.length} records`);
      return result;
    } catch (error) {
      console.error('Controller error:', error);
      throw new HttpException(
        'Failed to fetch attendance history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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

  @Post('test-email-notification')
  async testEmailNotification(
    @Body()
    testData: {
      studentId: number;
      classId: number;
      status: 'present' | 'absent' | 'late';
    },
  ): Promise<any> {
    try {
      const attendance = {
        studentId: testData.studentId,
        classId: testData.classId,
        date: new Date().toISOString().split('T')[0],
        status: testData.status,
        timestamp: new Date(),
        isPresent: testData.status === 'present',
      };

      console.log('🧪 Testing email notification with data:', attendance);
      const result = await this.attendanceService.create(attendance);

      return {
        success: true,
        message: 'Test attendance created and email notification sent',
        attendanceId: result.id,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Test failed: ' + error.message,
        error: error.message,
      };
    }
  }

  // ===== NEW ATTENDANCE ANALYSIS ENDPOINTS =====

  @Get('analysis/subjects/:grade')
  @Roles('teacher', 'admin')
  async getSubjectsByGrade(@Param('grade') grade: number): Promise<string[]> {
    return this.attendanceService.getSubjectsByGrade(Number(grade));
  }

  @Get('analysis/students/:grade/:subject')
  @Roles('teacher', 'admin')
  async getStudentsByGradeAndSubject(
    @Param('grade') grade: number,
    @Param('subject') subject: string,
  ): Promise<any[]> {
    return this.attendanceService.getStudentsByGradeAndSubject(
      Number(grade),
      decodeURIComponent(subject),
    );
  }

  @Get('analysis/attendance/:grade/:subject')
  @Roles('teacher', 'admin')
  async getAttendanceAnalysis(
    @Param('grade') grade: number,
    @Param('subject') subject: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AttendanceAnalysisResponseDto> {
    return this.attendanceService.getAttendanceAnalysisByGradeAndSubject(
      Number(grade),
      decodeURIComponent(subject),
      startDate,
      endDate,
    );
  }

  @Get('analysis/time-range/:grade/:subject/:timeRange')
  @Roles('teacher', 'admin')
  async getAttendanceAnalysisByTimeRange(
    @Param('grade') grade: number,
    @Param('subject') subject: string,
    @Param('timeRange') timeRange: 'week' | 'month' | 'year',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AttendanceAnalysisResponseDto> {
    return this.attendanceService.getAttendanceAnalysisByTimeRange(
      Number(grade),
      decodeURIComponent(subject),
      timeRange,
      startDate,
      endDate,
    );
  }

  @Get('analysis/payments/:grade/:subject')
  @Roles('teacher', 'admin')
  async getPaymentStatus(
    @Param('grade') grade: number,
    @Param('subject') subject: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ): Promise<StudentPaymentStatusDto[]> {
    return this.attendanceService.getPaymentStatusByGradeAndSubject(
      Number(grade),
      decodeURIComponent(subject),
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Get('analysis/comprehensive/:grade/:subject')
  @Roles('teacher', 'admin')
  async getComprehensiveAnalysis(
    @Param('grade') grade: number,
    @Param('subject') subject: string,
    @Query('timeRange') timeRange: 'week' | 'month' | 'year' = 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AttendanceAnalysisResponseDto> {
    return this.attendanceService.getComprehensiveAnalysis(
      Number(grade),
      decodeURIComponent(subject),
      timeRange,
      startDate,
      endDate,
    );
  }

  @Get('analysis/chart-data/:grade/:subject')
  @Roles('teacher', 'admin')
  async getAttendanceChartData(
    @Param('grade') grade: number,
    @Param('subject') subject: string,
    @Query('timeRange') timeRange: 'week' | 'month' | 'year' = 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ChartDataResponseDto> {
    const analysis =
      await this.attendanceService.getAttendanceAnalysisByTimeRange(
        Number(grade),
        decodeURIComponent(subject),
        timeRange,
        startDate,
        endDate,
      );

    return {
      chartData: analysis.chartData,
      summary: analysis.summary,
      timeRange: analysis.timeRange,
    };
  }
}
