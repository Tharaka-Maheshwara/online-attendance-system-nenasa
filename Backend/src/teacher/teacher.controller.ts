import { Controller, Get, Post, Body, Patch, Param, Delete, Logger } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Controller('teachers')
export class TeacherController {
  private readonly logger = new Logger(TeacherController.name);

  constructor(private readonly teacherService: TeacherService) {}

  @Post()
  async create(@Body() createTeacherDto: CreateTeacherDto) {
    this.logger.log('Creating new teacher');
    return this.teacherService.createTeacher(createTeacherDto);
  }

  @Get()
  async findAll() {
    return this.teacherService.findAll();
  }

  @Get('active')
  async findActive() {
    return this.teacherService.getActiveTeachers();
  }

  @Get('department/:department')
  async findByDepartment(@Param('department') department: string) {
    return this.teacherService.getTeachersByDepartment(department);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.teacherService.findOne(+id);
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    return this.teacherService.findByUserId(+userId);
  }

  @Get('teacher-id/:teacherId')
  async findByTeacherId(@Param('teacherId') teacherId: string) {
    return this.teacherService.findByTeacherId(teacherId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    this.logger.log(`Updating teacher with ID: ${id}`);
    return this.teacherService.update(+id, updateTeacherDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    this.logger.log(`Deleting teacher with ID: ${id}`);
    return this.teacherService.remove(+id);
  }
}
