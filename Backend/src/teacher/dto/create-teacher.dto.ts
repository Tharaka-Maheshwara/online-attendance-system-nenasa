export class CreateTeacherDto {
  teacher_id: string;
  user_id: number;
  employee_id?: string;
  department?: string;
  subject_specialization?: string;
  qualification?: string;
  experience_years?: number;
  joining_date?: string;
  phone_number?: string;
  emergency_contact?: string;
  is_active?: boolean;
}
