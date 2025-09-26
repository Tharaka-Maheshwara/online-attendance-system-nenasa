# Attendance System Role-Based Access Control (RBAC)

## Overview
The attendance system now implements strict role-based access control to ensure that only authorized users can mark and modify attendance records.

## Role Restrictions

### 🚫 **STUDENTS CANNOT:**
- Mark attendance for themselves or others
- Create new attendance records
- Update existing attendance records
- Delete attendance records
- View other students' attendance records
- View all attendance records
- View class-wide attendance data

### ✅ **STUDENTS CAN:**
- View their own attendance records only (via `/attendance/my-attendance`)

### 👨‍🏫 **TEACHERS CAN:**
- Mark attendance for all students
- Create new attendance records
- Update existing attendance records
- View all attendance records
- View class-wide attendance data
- View individual student attendance records

### 🔑 **ADMINS CAN:**
- All teacher permissions PLUS:
- Delete attendance records
- Full system access

## API Endpoints Access Control

### Attendance Endpoints:
```
POST /attendance                    - ⭕ Teacher, Admin only
GET  /attendance                    - ⭕ Teacher, Admin only
GET  /attendance/:id                - ⭕ Teacher, Admin only
PUT  /attendance/:id                - ⭕ Teacher, Admin only
DELETE /attendance/:id              - ⭕ Admin only
GET  /attendance/class/:classId     - ⭕ Teacher, Admin only
GET  /attendance/student/:studentId - ⭕ Teacher, Admin only
GET  /attendance/my-attendance      - ⭕ Student only
GET  /attendance/class/:classId/date/:date - ⭕ Teacher, Admin only
```

## Implementation Details

### Authentication & Authorization Flow:
1. **JWT Authentication**: All endpoints require valid JWT token
2. **Role Verification**: User's role is extracted from JWT payload
3. **Access Control**: Each endpoint checks required roles via `@Roles()` decorator
4. **User Context**: Current user information is available in request object

### Guards Used:
- `JwtAuthGuard`: Validates JWT token
- `RolesGuard`: Checks user roles against endpoint requirements

### Error Responses:
- **401 Unauthorized**: Invalid or missing JWT token
- **403 Forbidden**: Valid user but insufficient role permissions

## Security Features

### 🔐 **Prevented Student Actions:**
- Self-attendance marking (prevents cheating)
- Viewing other students' records (privacy protection)
- Modifying attendance data (data integrity)
- Access to administrative functions

### 🛡️ **Data Protection:**
- Students can only access their own attendance data
- All modification operations require teacher/admin privileges
- Comprehensive audit trail through user context

## Testing the Restrictions

### Test Student Access (Should Fail):
```bash
# These should return 403 Forbidden for student users
POST /attendance
PUT /attendance/1
DELETE /attendance/1
GET /attendance/student/123  # if 123 is not the student's own ID
```

### Test Student Allowed Access:
```bash
# This should work for student users
GET /attendance/my-attendance
```

### Test Teacher/Admin Access:
```bash
# All endpoints should work for teacher/admin users
POST /attendance
GET /attendance
PUT /attendance/1
# etc.
```

## Configuration

The system uses the existing user roles from the `nenasala_users` table:
- `admin`: Full access
- `teacher`: Attendance management access  
- `student`: Read-only access to own data
- `user`: No attendance system access

## Migration Notes

If you have existing student users who were previously able to mark attendance:
1. Their role should already be set to 'student' in the database
2. They will automatically lose attendance marking privileges
3. They retain access to view their own attendance records
4. No database migration is required

## Benefits

✅ **Security**: Prevents unauthorized attendance manipulation  
✅ **Privacy**: Students can't access others' data  
✅ **Integrity**: Only authorized staff can modify records  
✅ **Compliance**: Proper access control for educational systems  
✅ **Audit**: Clear responsibility chain for attendance marking