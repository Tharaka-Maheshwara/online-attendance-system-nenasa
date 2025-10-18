import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  courseName: string;

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsDateString()
  startDate: string;

  @IsNumber()
  @Min(1)
  maxStudents: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @IsOptional()
  teacherId?: number;

  @IsString()
  @IsOptional()
  description?: string;
}
