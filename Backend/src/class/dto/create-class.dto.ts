import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsOptional()
  @IsString()
  teacherName?: string;

  @IsOptional()
  @IsNumber()
  teacherId?: number;

  @IsOptional()
  @IsNumber()
  grade?: number;

  @IsString()
  @IsOptional()
  dayOfWeek?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  monthlyFees?: number;
}
