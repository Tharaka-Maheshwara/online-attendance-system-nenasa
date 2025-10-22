import {
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import type { PaymentStatus } from '../payment.entity';

export class CreatePaymentDto {
  @IsNumber()
  studentId: number;

  @IsNumber()
  classId: number;

  @IsNumber()
  amount: number;

  @IsNumber()
  month: number;

  @IsNumber()
  year: number;

  @IsOptional()
  @IsEnum(['pending', 'paid', 'overdue'])
  status?: PaymentStatus;

  @IsOptional()
  @IsDateString()
  paidDate?: Date;

  @IsOptional()
  @IsNumber()
  paidBy?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
