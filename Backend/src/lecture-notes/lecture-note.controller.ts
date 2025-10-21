import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import {
  LectureNoteService,
  CreateLectureNoteDto,
} from './lecture-note.service';
import { MockAuthGuard } from '../auth/mock-auth.guard';
import * as path from 'path';
import * as fs from 'fs';

// Configure multer for file uploads
const storage = diskStorage({
  destination: './uploads/lecture-notes',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(
      new HttpException('Only PDF files are allowed', HttpStatus.BAD_REQUEST),
      false,
    );
  }
};

@Controller('lecture-notes')
@UseGuards(MockAuthGuard)
export class LectureNoteController {
  constructor(private readonly lectureNoteService: LectureNoteService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadLectureNote(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Request() req,
  ) {
    try {
      if (!file) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      const userEmail = req.user?.email || req.user?.upn;
      if (!userEmail) {
        throw new HttpException(
          'User email not found in token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const createLectureNoteDto: CreateLectureNoteDto = {
        title: body.title,
        description: body.description || '',
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        teacherEmail: body.teacherEmail || userEmail,
        classId: parseInt(body.classId),
        studentIds: JSON.parse(body.studentIds),
      };

      const lectureNote =
        await this.lectureNoteService.createLectureNote(createLectureNoteDto);

      return {
        success: true,
        message: 'Lecture note uploaded successfully',
        data: lectureNote,
      };
    } catch (error) {
      // Clean up uploaded file if there's an error
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to upload lecture note',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('teacher')
  async getTeacherLectureNotes(@Request() req) {
    try {
      const userEmail = req.user?.email || req.user?.upn;
      if (!userEmail) {
        throw new HttpException(
          'User email not found in token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const notes =
        await this.lectureNoteService.getLectureNotesByTeacher(userEmail);

      // Add class information to each note
      const notesWithClassInfo = notes.map((note) => ({
        ...note,
        className: `Class ${note.classId}`,
      }));

      return {
        success: true,
        data: notesWithClassInfo,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch lecture notes',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('student/:studentId')
  async getStudentLectureNotes(@Param('studentId') studentId: number) {
    try {
      const notes =
        await this.lectureNoteService.getLectureNotesForStudent(studentId);

      return {
        success: true,
        data: notes,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch lecture notes',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('download/:id')
  async downloadLectureNote(@Param('id') id: number, @Res() res: Response) {
    try {
      const note = await this.lectureNoteService.getLectureNoteById(id);

      if (!fs.existsSync(note.filePath)) {
        throw new HttpException('File not found', HttpStatus.NOT_FOUND);
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${note.fileName}"`,
      );

      const fileStream = fs.createReadStream(note.filePath);
      fileStream.pipe(res);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to download lecture note',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('all')
  async getAllLectureNotes() {
    try {
      const notes = await this.lectureNoteService.getAllLectureNotes();

      return {
        success: true,
        data: notes,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch lecture notes',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  async getLectureNoteStats(@Request() req) {
    try {
      const userEmail = req.user?.email || req.user?.upn;
      const stats =
        await this.lectureNoteService.getLectureNoteStats(userEmail);

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch lecture note stats',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getLectureNoteById(@Param('id') id: number) {
    try {
      const note = await this.lectureNoteService.getLectureNoteById(id);

      return {
        success: true,
        data: note,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch lecture note',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteLectureNote(@Param('id') id: number, @Request() req) {
    try {
      const userEmail = req.user?.email || req.user?.upn;
      if (!userEmail) {
        throw new HttpException(
          'User email not found in token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      await this.lectureNoteService.deleteLectureNote(id, userEmail);

      return {
        success: true,
        message: 'Lecture note deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to delete lecture note',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
