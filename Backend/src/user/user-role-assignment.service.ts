import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { User, UserRole } from './user.entity';

@Injectable()
export class UserRoleAssignmentService {
  private readonly logger = new Logger(UserRoleAssignmentService.name);

  private studentService: any;
  private teacherService: any;

  constructor() {}

  // Set services to avoid circular dependency
  setStudentService(studentService: any) {
    this.studentService = studentService;
  }

  setTeacherService(teacherService: any) {
    this.teacherService = teacherService;
  }

  async assignUserToRoleTable(user: User): Promise<void> {
    try {
      if (user.role === 'student' && this.studentService) {
        await this.studentService.createStudentFromUser(user);
        this.logger.log(`User ${user.email} added to students table`);
      } else if (user.role === 'teacher' && this.teacherService) {
        await this.teacherService.createTeacherFromUser(user);
        this.logger.log(`User ${user.email} added to teachers table`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to assign user ${user.email} to role table:`,
        error,
      );
    }
  }
}
