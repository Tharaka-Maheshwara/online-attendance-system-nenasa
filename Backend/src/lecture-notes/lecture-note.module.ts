import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { LectureNote } from './lecture-note.entity';
import { LectureNoteService } from './lecture-note.service';
import { LectureNoteController } from './lecture-note.controller';
import * as fs from 'fs';

// Ensure upload directory exists
const uploadDir = './uploads/lecture-notes';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Module({
  imports: [
    TypeOrmModule.forFeature([LectureNote]),
    MulterModule.register({
      dest: uploadDir,
    }),
  ],
  controllers: [LectureNoteController],
  providers: [LectureNoteService],
  exports: [LectureNoteService],
})
export class LectureNoteModule {}