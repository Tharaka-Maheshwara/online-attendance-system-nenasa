import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('payment')
// @UseGuards(JwtAuthGuard, RolesGuard) // Temporarily disabled for testing
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @Roles('admin', 'teacher')
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.create(createPaymentDto);
  }

  @Get()
  @Roles('admin', 'teacher')
  findAll() {
    return this.paymentService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'teacher')
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(+id);
  }

  @Patch(':id')
  @Roles('admin', 'teacher')
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentService.update(+id, updatePaymentDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.paymentService.remove(+id);
  }

  @Get('class/:classId/status')
  @Roles('admin', 'teacher')
  getPaymentStatusForClass(@Param('classId') classId: string) {
    return this.paymentService.getPaymentStatusForClass(+classId);
  }

  @Post('mark-paid')
  @Roles('admin', 'teacher')
  markAsPaid(
    @Body() body: { studentId: number; classId: number; paidBy: number }
  ) {
    return this.paymentService.markAsPaid(
      body.studentId,
      body.classId,
      body.paidBy
    );
  }

  @Get('student/:studentId/history')
  @Roles('admin', 'teacher', 'student')
  getStudentPaymentHistory(@Param('studentId') studentId: string) {
    return this.paymentService.getStudentPaymentHistory(+studentId);
  }
}