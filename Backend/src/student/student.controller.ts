import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Param,
  Body,
} from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
// import { UpdateStudentDto } from './dto/update-student.dto'; // Uncomment if you have this DTO

@Controller('student')
export class StudentController {
  @Post()
  createStudent(@Body() createStudentDto: CreateStudentDto) {
    // Implement student creation logic
    return 'Student created';
  }

  @Put(':studentId')
  updateStudent(
    @Param('studentId') studentId: string,
    @Body() updateStudentDto: any,
  ) {
    // Implement student update logic
    return `Student ${studentId} updated`;
  }

  @Delete(':studentId')
  deleteStudent(@Param('studentId') studentId: string) {
    // Implement student deletion logic
    return `Student ${studentId} deleted`;
  }

  @Get(':studentId')
  getStudent(@Param('studentId') studentId: string) {
    // Implement get single student logic
    return `Student ${studentId} details`;
  }

  @Get('s')
  getAllStudents() {
    // Implement get all students logic
    return 'All students';
  }
}
