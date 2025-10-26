import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from './class.entity';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';
import { Student } from '../student/student.entity';
import { Attendance } from '../attendance/attendance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Class, Student, Attendance])],
  controllers: [ClassController],
  providers: [ClassService],
})
export class ClassModule {}
