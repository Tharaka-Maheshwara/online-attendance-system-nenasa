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
import { TeacherService } from './teacher.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Controller('teacher')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('profileImage', {
      storage: diskStorage({
        destination: './uploads/teacher-images',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `teacher-${uniqueSuffix}${ext}`);
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
  async createTeacher(
    @Body() createTeacherDto: CreateTeacherDto,
    @UploadedFile() file?: any,
  ) {
    if (file) {
      createTeacherDto.profileImage = `/uploads/teacher-images/${file.filename}`;
    }
    return await this.teacherService.create(createTeacherDto);
  }

  @Put(':teacherId')
  @UseInterceptors(
    FileInterceptor('profileImage', {
      storage: diskStorage({
        destination: './uploads/teacher-images',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `teacher-${uniqueSuffix}${ext}`);
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
  async updateTeacher(
    @Param('teacherId') teacherId: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
    @UploadedFile() file?: any,
  ) {
    if (file) {
      updateTeacherDto.profileImage = `/uploads/teacher-images/${file.filename}`;
    }
    return await this.teacherService.update(+teacherId, updateTeacherDto);
  }

  @Delete(':teacherId')
  async deleteTeacher(@Param('teacherId') teacherId: string) {
    await this.teacherService.remove(+teacherId);
    return { message: `Teacher ${teacherId} deleted successfully` };
  }

  @Get(':teacherId')
  async getTeacher(@Param('teacherId') teacherId: string) {
    return await this.teacherService.findOne(+teacherId);
  }

  @Get('by-email/:email')
  async getTeacherByEmail(@Param('email') email: string) {
    return await this.teacherService.findByEmail(email);
  }

  @Get()
  async getAllTeachers() {
    return await this.teacherService.findAll();
  }

  @Get(':teacherId/classes/today')
  async getTodayClasses(@Param('teacherId') teacherId: string) {
    return await this.teacherService.getTodayClasses(+teacherId);
  }
}
