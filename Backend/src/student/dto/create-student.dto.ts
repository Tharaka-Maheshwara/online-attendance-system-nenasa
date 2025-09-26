import { IsOptional, IsString } from 'class-validator';

export class CreateStudentDto {
  name: string;
  email: string;
  registerNumber: string;
  contactNumber?: string;
  parentName?: string;
  parentEmail?: string;
  
  @IsOptional()
  @IsString()
  sub_1?: string;
  
  @IsOptional()
  @IsString()
  sub_2?: string;
  
  @IsOptional()
  @IsString()
  sub_3?: string;
  
  @IsOptional()
  @IsString()
  sub_4?: string;
}
