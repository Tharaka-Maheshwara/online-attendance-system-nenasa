import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

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
