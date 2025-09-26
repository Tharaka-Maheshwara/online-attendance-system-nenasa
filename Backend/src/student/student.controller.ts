import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Param,
  Body,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  async createStudent(@Body() createStudentDto: CreateStudentDto) {
    return await this.studentService.create(createStudentDto);
  }

  @Put(':studentId')
  async updateStudent(
    @Param('studentId') studentId: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return await this.studentService.update(+studentId, updateStudentDto);
  }

  @Delete(':studentId')
  async deleteStudent(@Param('studentId') studentId: string) {
    await this.studentService.remove(+studentId);
    return { message: `Student ${studentId} deleted successfully` };
  }

  @Get(':studentId')
  async getStudent(@Param('studentId') studentId: string) {
    return await this.studentService.findOne(+studentId);
  }

  @Get()
  async getAllStudents() {
    return await this.studentService.findAll();
  }

  @Get(':studentId/qrcode')
  async getStudentQRCode(@Param('studentId') studentId: string) {
    const student = await this.studentService.findOne(+studentId);
    if (!student) {
      throw new Error('Student not found');
    }
    const qrCode = await this.studentService.generateQRCodeDataURL(student);
    return { qrCode };
  }

  @Post('qr-lookup')
  async getStudentByQRData(@Body() qrData: any) {
    return await this.studentService.findByQRData(qrData);
  }

  
}
