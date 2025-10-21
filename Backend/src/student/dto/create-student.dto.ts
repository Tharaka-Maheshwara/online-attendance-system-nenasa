import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateStudentDto {
  name: string;
  email: string;
  registerNumber: string;
  contactNumber?: string;
  parentName?: string;
  parentEmail?: string;
  gender?: string;

  @IsOptional()
  @IsNumber()
  grade?: number;

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

  @IsOptional()
  @IsString()
  sub_5?: string;

  @IsOptional()
  @IsString()
  sub_6?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;
}
