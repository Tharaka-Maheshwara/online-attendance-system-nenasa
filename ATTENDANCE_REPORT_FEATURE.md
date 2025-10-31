# Student Attendance Report Download Feature

## Overview
මෙම feature එක මගින් Student Attendance History පිටුවෙන් විවිධ filters භාවිතයෙන් attendance reports PDF format එකෙහි download කර ගත හැක.

## Features Implemented

### 1. Single Date Report (එක් දිනයක් සඳහා Report)
- නිශ්චිත දිනයක් තෝරා, ඒ දවසේ සියලුම students ලාගේ attendance list එක බලා ගැනීම
- Grade සහ Subject අනුව filter කර ගැනීම
- PDF report එක download කර ගැනීම

**භාවිතය:**
1. Grade සහ Subject තෝරන්න
2. "Single Date Report" section එකට යන්න
3. දිනයක් තෝරන්න
4. "Download Report" button එක click කරන්න

### 2. Class-Specific Date Report (Class එකකට විශේෂිත Report)
- නිශ්චිත දිනයක්, නිශ්චිත class එකක attendance බලා ගැනීම
- ඒ class එකට අදාළ students කෙනෙක්ම පමණක් report එකෙහි ඇතුළත් වේ

**භාවිතය:**
1. Grade සහ Subject තෝරන්න
2. "Class-Specific Date Report" section එකට යන්න
3. දිනයක් තෝරන්න
4. Class එකක් තෝරන්න
5. "Download Report" button එක click කරන්න

### 3. Date Range Class Report (කාල සීමාවක් සඳහා Report)
- දින දෙකක් අතර කාල සීමාවක් තෝරා
- නිශ්චිත class එකකට අදාළ සියලුම attendance records බලා ගැනීම
- Summary statistics සමග

**භාවිතය:**
1. Grade සහ Subject තෝරන්න
2. "Date Range Class Report" section එකට යන්න
3. "From Date" සහ "To Date" තෝරන්න
4. Class එකක් තෝරන්න
5. "Download Report" button එක click කරන්න

## Report Features

### Report එකෙහි ඇතුළත් තොරතුරු:
- Header සමග Organization name
- Report title
- Applied filters (Date, Grade, Subject, Class)
- Generation timestamp
- Summary statistics box
  - Total Records
  - Present count
  - Absent count
  - Late count
  - Attendance percentage

### Table Columns:
1. No. (අනුක්‍රමිකය)
2. Student Name
3. Register Number
4. Class
5. Date
6. Status (Color-coded: Green=Present, Red=Absent, Orange=Late)
7. Time (Marked time)

### Additional Features:
- Multi-page support
- Page numbers
- Professional formatting
- Color-coded status indicators
- Automatic table pagination
- Footer with summary

## Technical Implementation

### Frontend (React)
**Files Modified:**
1. `Frontend/frontend-app/src/components/StudentAttendanceHistory/StudentAttendanceHistory.js`
   - Added report filter states
   - Added report generation functions
   - Added UI for report controls

2. `Frontend/frontend-app/src/components/StudentAttendanceHistory/StudentAttendanceHistory.css`
   - Added styles for report section
   - Responsive design support

**Files Created:**
3. `Frontend/frontend-app/src/utils/attendanceReportGenerator.js`
   - PDF generation utility functions
   - jsPDF and jspdf-autotable integration
   - Report formatting logic

### Backend (NestJS)
**Files Modified:**
1. `Backend/src/attendance/attendance.controller.ts`
   - Updated `findAll()` endpoint to accept query parameters
   - Added support for filtering by:
     - date (single date)
     - dateFrom & dateTo (date range)
     - grade
     - subject
     - classId

2. `Backend/src/attendance/attendance.service.ts`
   - Added `findWithFilters()` method
   - Implements database queries with filters
   - Fetches related student and class data
   - Returns enriched attendance records with names

## API Endpoints

### GET /attendance
Query Parameters:
- `date` (optional): Filter by specific date (YYYY-MM-DD)
- `dateFrom` (optional): Start date for range filter
- `dateTo` (optional): End date for range filter
- `grade` (optional): Filter by grade number
- `subject` (optional): Filter by subject name
- `classId` (optional): Filter by class ID

**Example Requests:**
```
GET /attendance?date=2025-10-31&grade=9&subject=English
GET /attendance?dateFrom=2025-10-01&dateTo=2025-10-31&classId=3
GET /attendance?date=2025-10-31
```

## Dependencies Added
```json
{
  "jspdf": "^2.x.x",
  "jspdf-autotable": "^3.x.x"
}
```

## Installation & Setup

1. Install frontend dependencies:
```bash
cd Frontend/frontend-app
npm install
```

2. Backend server should automatically support the new endpoints (no additional installation needed)

3. Start the application:
```bash
# Backend
cd Backend
npm run start:dev

# Frontend
cd Frontend/frontend-app
npm start
```

## Usage Guide

### Step-by-Step:

1. **Open Student Attendance History Page**
   - Navigate to the admin dashboard
   - Click on "Student Attendance History"

2. **Select Grade and Subject**
   - Choose a grade from the dropdown
   - Select a subject for that grade

3. **Generate Reports**
   - Scroll to the "Generate Attendance Reports" section
   - Choose your report type:
     - Single date for all students
     - Single date for specific class
     - Date range for specific class

4. **Download**
   - Click the "Download Report" button
   - PDF will be automatically downloaded to your browser's default download location

## File Naming Convention

Reports are automatically named based on filters:
- Single date: `attendance_2025-10-31.pdf`
- Class date: `attendance_english_grade_9_2025-10-31.pdf`
- Date range: `attendance_english_grade_9_2025-10-01_to_2025-10-31.pdf`

## Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## Security Notes

- All endpoints require authentication (JWT tokens)
- Only admin and teacher roles can access attendance data
- Reports contain sensitive student information - handle with care

## Future Enhancements (Possible)

1. Export to Excel/CSV format
2. Email reports directly to stakeholders
3. Scheduled automatic reports
4. Custom report templates
5. Additional charts and visualizations
6. Attendance comparison reports
7. Monthly/Weekly summary reports

## Troubleshooting

### Report not generating?
- Check if grade and subject are selected
- Verify date selections are valid
- Ensure there is attendance data for selected filters
- Check browser console for errors

### Empty report?
- Verify attendance records exist for selected date/range
- Check if class has any students enrolled
- Ensure date format is correct

### PDF not downloading?
- Check browser download settings
- Allow pop-ups for the application
- Check browser console for errors

## Support

For issues or questions, contact the development team or check the application logs.

---

**Last Updated:** October 31, 2025
**Version:** 1.0.0
