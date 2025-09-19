export class CreateStudentDto {
  name: string;
  email: string;
  registerNumber: string;
  contactNumber?: string;
  parentName?: string;
  parentEmail?: string;
}
