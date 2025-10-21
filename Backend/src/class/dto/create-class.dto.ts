import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

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
}
