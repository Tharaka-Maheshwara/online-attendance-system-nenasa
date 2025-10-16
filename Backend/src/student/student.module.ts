import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { Student } from './student.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student]), 
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
