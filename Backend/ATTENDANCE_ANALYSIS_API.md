# Student Attendance Analysis API Documentation

This document describes the new API endpoints for comprehensive student attendance analysis, including grade and subject filtering, attendance charts, and payment status checking.

## Features

1. **Grade and Subject Filtering**: Filter students by grade and subject
2. **Attendance Analysis**: Detailed attendance statistics and trends
3. **Chart Data Generation**: Data formatted for chart visualization
4. **Time-based Filtering**: Weekly, monthly, and yearly analysis
5. **Payment Integration**: Class fee payment status checking
6. **Comprehensive Reports**: Combined attendance and payment analysis

## API Endpoints

### 1. Get Available Subjects by Grade

```
GET /attendance/analysis/subjects/:grade
```

**Description**: Returns list of available subjects for a specific grade.

**Parameters**:
- `grade` (path): Grade number

**Response**: Array of subject names

**Example**:
```bash
GET /attendance/analysis/subjects/10
```

---

### 2. Get Students by Grade and Subject

```
GET /attendance/analysis/students/:grade/:subject
```

**Description**: Returns students registered for a specific grade and subject.

**Parameters**:
- `grade` (path): Grade number
- `subject` (path): Subject name (URL encoded)

**Response**: Array of student objects with basic information

**Example**:
```bash
GET /attendance/analysis/students/10/Mathematics
```

---

### 3. Basic Attendance Analysis

```
GET /attendance/analysis/attendance/:grade/:subject
```

**Description**: Get attendance analysis for students in a specific grade and subject.

**Parameters**:
- `grade` (path): Grade number
- `subject` (path): Subject name (URL encoded)
- `startDate` (query, optional): Start date (YYYY-MM-DD)
- `endDate` (query, optional): End date (YYYY-MM-DD)

**Response**: AttendanceAnalysisResponseDto
```typescript
{
  students: [
    {
      id: number,
      name: string,
      email: string,
      registerNumber: string,
      grade: number,
      subjects: string[],
      attendanceStats: {
        totalClasses: number,
        presentCount: number,
        absentCount: number,
        lateCount: number,
        attendanceRate: number
      },
      recentAttendance: any[]
    }
  ],
  chartData: [
    {
      date: string,
      present: number,
      absent: number,
      late: number,
      total: number
    }
  ],
  summary: {
    totalStudents: number,
    totalClasses: number,
    overallAttendanceRate: number,
    classInfo: {
      id: number,
      subject: string,
      grade: number,
      teacherName: string,
      monthlyFees: number
    }
  }
}
```

**Example**:
```bash
GET /attendance/analysis/attendance/10/Mathematics?startDate=2024-01-01&endDate=2024-01-31
```

---

### 4. Time-Range Based Analysis

```
GET /attendance/analysis/time-range/:grade/:subject/:timeRange
```

**Description**: Get attendance analysis for predefined time ranges.

**Parameters**:
- `grade` (path): Grade number
- `subject` (path): Subject name (URL encoded)
- `timeRange` (path): 'week' | 'month' | 'year'
- `startDate` (query, optional): Custom start date (overrides timeRange)
- `endDate` (query, optional): Custom end date (overrides timeRange)

**Response**: AttendanceAnalysisResponseDto with timeRange information

**Examples**:
```bash
GET /attendance/analysis/time-range/10/Mathematics/month
GET /attendance/analysis/time-range/10/Mathematics/week
GET /attendance/analysis/time-range/10/Mathematics/year
```

---

### 5. Payment Status Analysis

```
GET /attendance/analysis/payments/:grade/:subject
```

**Description**: Get payment status for students in a specific grade and subject.

**Parameters**:
- `grade` (path): Grade number
- `subject` (path): Subject name (URL encoded)
- `month` (query, optional): Month number (1-12, defaults to current month)
- `year` (query, optional): Year (defaults to current year)

**Response**: Array of StudentPaymentStatusDto
```typescript
[
  {
    id: number,
    name: string,
    email: string,
    registerNumber: string,
    grade: number,
    subjects: string[],
    paymentStatus: 'paid' | 'pending' | 'overdue',
    monthlyFee: number,
    paymentDetails: {
      id: number,
      amount: number,
      month: number,
      year: number,
      paidDate: Date,
      notes: string
    } | null
  }
]
```

**Example**:
```bash
GET /attendance/analysis/payments/10/Mathematics?month=1&year=2024
```

---

### 6. Comprehensive Analysis (Attendance + Payments)

```
GET /attendance/analysis/comprehensive/:grade/:subject
```

**Description**: Get combined attendance and payment analysis.

**Parameters**:
- `grade` (path): Grade number
- `subject` (path): Subject name (URL encoded)
- `timeRange` (query, optional): 'week' | 'month' | 'year' (default: 'month')
- `startDate` (query, optional): Custom start date
- `endDate` (query, optional): Custom end date

**Response**: AttendanceAnalysisResponseDto with paymentSummary
```typescript
{
  // ... attendance data ...
  paymentSummary: {
    totalStudents: number,
    paidStudents: number,
    pendingStudents: number,
    overdueStudents: number,
    totalMonthlyRevenue: number,
    collectedRevenue: number
  }
}
```

**Example**:
```bash
GET /attendance/analysis/comprehensive/10/Mathematics?timeRange=month
```

---

### 7. Chart Data Only

```
GET /attendance/analysis/chart-data/:grade/:subject
```

**Description**: Get only chart data for visualization.

**Parameters**:
- `grade` (path): Grade number
- `subject` (path): Subject name (URL encoded)
- `timeRange` (query, optional): 'week' | 'month' | 'year' (default: 'month')
- `startDate` (query, optional): Custom start date
- `endDate` (query, optional): Custom end date

**Response**: ChartDataResponseDto
```typescript
{
  chartData: [
    {
      date: string,
      present: number,
      absent: number,
      late: number,
      total: number
    }
  ],
  summary: { /* basic summary */ },
  timeRange: {
    type: string,
    startDate: string,
    endDate: string
  }
}
```

**Example**:
```bash
GET /attendance/analysis/chart-data/10/Mathematics?timeRange=week
```

## Security

All endpoints require authentication and appropriate role permissions:
- **Required Roles**: 'teacher' or 'admin'
- **Authentication**: JWT token required
- **Guards**: JwtAuthGuard and RolesGuard applied

## Usage Examples

### Frontend Integration

```javascript
// Get available subjects for grade 10
const subjects = await fetch('/api/attendance/analysis/subjects/10');

// Get comprehensive analysis for Mathematics in grade 10
const analysis = await fetch('/api/attendance/analysis/comprehensive/10/Mathematics?timeRange=month');

// Get only chart data for visualization
const chartData = await fetch('/api/attendance/analysis/chart-data/10/Mathematics?timeRange=week');

// Get payment status
const payments = await fetch('/api/attendance/analysis/payments/10/Mathematics');
```

### Chart.js Integration Example

```javascript
// Fetch chart data
const response = await fetch('/api/attendance/analysis/chart-data/10/Mathematics?timeRange=month');
const data = await response.json();

// Configure Chart.js
const chartConfig = {
  type: 'line',
  data: {
    labels: data.chartData.map(item => item.date),
    datasets: [
      {
        label: 'Present',
        data: data.chartData.map(item => item.present),
        borderColor: 'green',
        backgroundColor: 'rgba(0, 255, 0, 0.1)'
      },
      {
        label: 'Absent',
        data: data.chartData.map(item => item.absent),
        borderColor: 'red',
        backgroundColor: 'rgba(255, 0, 0, 0.1)'
      },
      {
        label: 'Late',
        data: data.chartData.map(item => item.late),
        borderColor: 'orange',
        backgroundColor: 'rgba(255, 165, 0, 0.1)'
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `Attendance Analysis - ${data.summary.classInfo.subject} (Grade ${data.summary.classInfo.grade})`
      }
    }
  }
};
```

## Error Handling

All endpoints include proper error handling:
- **400 Bad Request**: Invalid parameters
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Grade/subject not found
- **500 Internal Server Error**: Database or processing errors

## Performance Considerations

- Endpoints are optimized for database queries
- Use date ranges to limit data retrieval
- Chart data is pre-processed for frontend consumption
- Payment data is cached where appropriate

## Future Enhancements

1. **Export Functionality**: PDF/Excel export of reports
2. **Real-time Updates**: WebSocket support for live attendance updates
3. **Caching**: Redis caching for frequently accessed data
4. **Batch Operations**: Bulk attendance marking with analysis
5. **Notification Integration**: Automated alerts for low attendance