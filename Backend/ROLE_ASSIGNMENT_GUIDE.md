# Automatic Role Assignment Implementation

## Overview
This implementation automatically creates or updates user records in the `nenasala_users` table with appropriate roles when students or teachers are added to their respective tables.

## What was implemented:

### 1. Student Service Enhancement
When a new student is created via the Student API:
- A student record is created in the `student` table
- Automatically creates/updates a user record in `nenasala_users` table with:
  - `role: 'student'`
  - `display_name`: student's name
  - `register_number`: student's register number
  - `email`: student's email
  - `contactNumber`: student's contact number
  - `parentEmail`: student's parent email
  - `parentName`: student's parent name

### 2. Teacher Service Enhancement
When a new teacher is created via the Teacher API:
- A teacher record is created in the `teacher` table
- Automatically creates/updates a user record in `nenasala_users` table with:
  - `role: 'teacher'`
  - `display_name`: teacher's name
  - `register_number`: teacher's register number
  - `email`: teacher's email
  - `contactNumber`: teacher's contact number

## How it works:

### For Students:
1. When `StudentService.create()` is called
2. Student record is saved to `student` table
3. System checks if a user with the same email already exists in `nenasala_users`
4. If user exists: Updates the user with student role and student-specific data
5. If user doesn't exist: Creates new user with student role and student-specific data

### For Teachers:
1. When `TeacherService.create()` is called
2. Teacher record is saved to `teacher` table
3. System checks if a user with the same email already exists in `nenasala_users`
4. If user exists: Updates the user with teacher role and teacher-specific data
5. If user doesn't exist: Creates new user with teacher role and teacher-specific data

## Error Handling:
- If there's an error during user creation/update, it's logged but doesn't prevent the student/teacher creation
- This ensures that primary operations (creating students/teachers) aren't blocked by user management issues

## API Usage Examples:

### Creating a Student:
```bash
POST /students
{
  "name": "John Doe",
  "email": "john.doe@school.com",
  "registerNumber": "ST001",
  "contactNumber": "0771234567",
  "parentName": "Jane Doe",
  "parentEmail": "jane.doe@parent.com"
}
```

This will:
1. Create a student record
2. Automatically create/update a user record with role 'student'

### Creating a Teacher:
```bash
POST /teachers
{
  "name": "Mr. Smith",
  "email": "smith@school.com",
  "registerNumber": "TC001",
  "contactNumber": "0779876543",
  "sub_01": "Mathematics",
  "sub_02": "Physics"
}
```

This will:
1. Create a teacher record
2. Automatically create/update a user record with role 'teacher'

## Database Tables Affected:
- `student` table: Stores student-specific information
- `teacher` table: Stores teacher-specific information
- `nenasala_users` table: Stores user authentication/authorization information with roles

## Module Dependencies:
- `StudentModule` now imports `UserModule` to access `UserService`
- `TeacherModule` now imports `UserModule` to access `UserService`
- Both services inject `UserService` for user management operations

## Benefits:
1. **Automatic Role Assignment**: No manual intervention needed for role assignment
2. **Data Consistency**: User records are automatically synchronized with student/teacher data
3. **Centralized User Management**: All user authentication/authorization data is in one place
4. **Role-Based Access Control**: Users automatically get appropriate roles for their function