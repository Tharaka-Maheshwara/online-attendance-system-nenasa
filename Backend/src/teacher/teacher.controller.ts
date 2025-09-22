import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Param,
  Body,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Controller('teacher')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post()
  async createTeacher(@Body() createTeacherDto: CreateTeacherDto) {
    return await this.teacherService.create(createTeacherDto);
  }

  @Put(':teacherId')
  async updateTeacher(
    @Param('teacherId') teacherId: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ) {
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

  @Get()
  async getAllTeachers() {
    return await this.teacherService.findAll();
  }
}