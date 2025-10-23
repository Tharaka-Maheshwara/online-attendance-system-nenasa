export class AttendanceAnalysisRequestDto {
  grade: number;
  subject: string;
  startDate?: string;
  endDate?: string;
  timeRange?: 'week' | 'month' | 'year';
}

export class StudentAttendanceStatsDto {
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
}

export class StudentWithAttendanceDto {
  id: number;
  name: string;
  email: string;
  registerNumber: string;
  grade: number;
  subjects: string[];
  attendanceStats: StudentAttendanceStatsDto;
  recentAttendance: any[];
  paymentStatus?: string;
  monthlyFee?: number;
  paymentDetails?: any;
}

export class AttendanceChartDataDto {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

export class AttendanceSummaryDto {
  totalStudents: number;
  totalClasses: number;
  overallAttendanceRate: number;
  classInfo: {
    id: number;
    subject: string;
    grade: number;
    teacherName: string;
    monthlyFees: number;
  };
}

export class PaymentSummaryDto {
  totalStudents: number;
  paidStudents: number;
  pendingStudents: number;
  overdueStudents: number;
  totalMonthlyRevenue: number;
  collectedRevenue: number;
}

export class AttendanceAnalysisResponseDto {
  students: StudentWithAttendanceDto[];
  chartData: AttendanceChartDataDto[];
  summary: AttendanceSummaryDto;
  paymentSummary?: PaymentSummaryDto;
  timeRange?: {
    type: string;
    startDate: string;
    endDate: string;
  };
}

export class ChartDataResponseDto {
  chartData: AttendanceChartDataDto[];
  summary: AttendanceSummaryDto;
  timeRange: {
    type: string;
    startDate: string;
    endDate: string;
  };
}

export class StudentPaymentStatusDto {
  id: number;
  name: string;
  email: string;
  registerNumber: string;
  grade: number;
  subjects: string[];
  paymentStatus: string;
  monthlyFee: number;
  paymentDetails: {
    id: number;
    amount: number;
    month: number;
    year: number;
    paidDate: Date;
    notes: string;
  } | null;
}