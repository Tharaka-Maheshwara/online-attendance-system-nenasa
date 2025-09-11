import { Controller, Get, Post, Body, Patch, Param, Delete, Logger } from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller('students')
export class StudentController {
  private readonly logger = new Logger(StudentController.name);

  constructor(private readonly studentService: StudentService) {}

  @Post()
  async create(@Body() createStudentDto: CreateStudentDto) {
    this.logger.log('Creating new student');
    return this.studentService.createStudent(createStudentDto);
  }

  @Get()
  async findAll() {
    return this.studentService.findAll();
  }

  @Get('active')
  async findActive() {
    return this.studentService.getActiveStudents();
  }

  @Get('grade/:grade')
  async findByGrade(@Param('grade') grade: string) {
    return this.studentService.getStudentsByGrade(grade);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.studentService.findOne(+id);
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    return this.studentService.findByUserId(+userId);
  }

  @Get('student-id/:studentId')
  async findByStudentId(@Param('studentId') studentId: string) {
    return this.studentService.findByStudentId(studentId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    this.logger.log(`Updating student with ID: ${id}`);
    return this.studentService.update(+id, updateStudentDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    this.logger.log(`Deleting student with ID: ${id}`);
    return this.studentService.remove(+id);
  }
}
