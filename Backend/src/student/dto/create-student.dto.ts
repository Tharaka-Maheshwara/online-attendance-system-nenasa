export class CreateStudentDto {
  student_id: string;
  user_id: number;
  grade?: string;
  class_section?: string;
  admission_date?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  is_active?: boolean;
}
