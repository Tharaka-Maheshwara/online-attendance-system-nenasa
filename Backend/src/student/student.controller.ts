import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  // File upload configuration
  private getMulterOptions() {
    return {
      storage: diskStorage({
        destination: './uploads/student-images',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `student-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    };
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('profileImage', {
      storage: diskStorage({
        destination: './uploads/student-images',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `student-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async createStudent(
    @Body() createStudentDto: CreateStudentDto,
    @UploadedFile() file?: any,
  ) {
    // Add image path to student data if file was uploaded
    if (file) {
      createStudentDto.profileImage = `/uploads/student-images/${file.filename}`;
    }

    return await this.studentService.create(createStudentDto);
  }

  @Put(':studentId')
  @UseInterceptors(
    FileInterceptor('profileImage', {
      storage: diskStorage({
        destination: './uploads/student-images',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `student-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async updateStudent(
    @Param('studentId') studentId: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @UploadedFile() file?: any,
  ) {
    // Add image path to student data if file was uploaded
    if (file) {
      updateStudentDto.profileImage = `/uploads/student-images/${file.filename}`;
    }

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

  @Get(':studentId/classes/today')
  async getTodayClassesForStudent(@Param('studentId') studentId: string) {
    return await this.studentService.getTodayClassesForStudent(+studentId);
  }

  @Get('email/:email/classes/today')
  async getTodayClassesForStudentByEmail(@Param('email') email: string) {
    return await this.studentService.getTodayClassesForStudentByEmail(email);
  }

  @Get(':studentId/classes/all')
  async getAllClassesForStudent(@Param('studentId') studentId: string) {
    return await this.studentService.getAllClassesForStudent(+studentId);
  }

  @Get('email/:email/classes/all')
  async getAllClassesForStudentByEmail(@Param('email') email: string) {
    return await this.studentService.getAllClassesForStudentByEmail(email);
  }

  @Get(':studentId/classes/payment-status')
  async getStudentClassesWithPaymentStatus(
    @Param('studentId') studentId: string,
  ) {
    return await this.studentService.getStudentClassesWithPaymentStatus(
      +studentId,
    );
  }

  @Get('email/:email/classes/payment-status')
  async getStudentClassesWithPaymentStatusByEmail(
    @Param('email') email: string,
  ) {
    return await this.studentService.getStudentClassesWithPaymentStatusByEmail(
      email,
    );
  }
}
