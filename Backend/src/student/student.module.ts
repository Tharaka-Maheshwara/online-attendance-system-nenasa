import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { Student } from './student.entity';
import { Class } from '../class/class.entity';
import { Payment } from '../payment/payment.entity';
import { Announcement } from '../announcement/announcement.entity';
import { LectureNote } from '../lecture-notes/lecture-note.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Class, Payment, Announcement, LectureNote]),
    UserModule,
    MulterModule.register({
      dest: './uploads/student-images',
    }),
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
