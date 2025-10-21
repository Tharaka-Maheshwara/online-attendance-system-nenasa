import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LectureNote } from './lecture-note.entity';
import * as fs from 'fs';
import * as path from 'path';

export interface CreateLectureNoteDto {
  title: string;
  description?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  teacherEmail: string;
  classId: number;
  studentIds: number[];
}

@Injectable()
export class LectureNoteService {
  constructor(
    @InjectRepository(LectureNote)
    private lectureNoteRepository: Repository<LectureNote>,
  ) {}

  async createLectureNote(
    createLectureNoteDto: CreateLectureNoteDto,
  ): Promise<LectureNote> {
    const lectureNote = this.lectureNoteRepository.create({
      ...createLectureNoteDto,
      studentCount: createLectureNoteDto.studentIds.length,
    });

    return await this.lectureNoteRepository.save(lectureNote);
  }

  async getLectureNotesByTeacher(teacherEmail: string): Promise<LectureNote[]> {
    return await this.lectureNoteRepository.find({
      where: { teacherEmail },
      order: { createdAt: 'DESC' },
    });
  }

  async getLectureNotesForStudent(studentId: number): Promise<LectureNote[]> {
    const notes = await this.lectureNoteRepository
      .createQueryBuilder('lectureNote')
      .where('JSON_CONTAINS(lectureNote.studentIds, :studentId)', {
        studentId: JSON.stringify(studentId),
      })
      .orderBy('lectureNote.createdAt', 'DESC')
      .getMany();

    return notes;
  }

  async getAllLectureNotes(): Promise<LectureNote[]> {
    return await this.lectureNoteRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getLectureNoteById(id: number): Promise<LectureNote> {
    const note = await this.lectureNoteRepository.findOne({
      where: { id },
    });

    if (!note) {
      throw new Error('Lecture note not found');
    }

    return note;
  }

  async deleteLectureNote(id: number, teacherEmail: string): Promise<void> {
    const note = await this.lectureNoteRepository.findOne({
      where: { id, teacherEmail },
    });

    if (!note) {
      throw new Error(
        'Lecture note not found or you do not have permission to delete it',
      );
    }

    // Delete the file from filesystem
    try {
      if (fs.existsSync(note.filePath)) {
        fs.unlinkSync(note.filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    await this.lectureNoteRepository.delete(id);
  }

  async getLectureNoteStats(teacherEmail?: string): Promise<any> {
    const queryBuilder = this.lectureNoteRepository.createQueryBuilder('note');

    if (teacherEmail) {
      queryBuilder.where('note.teacherEmail = :teacherEmail', {
        teacherEmail,
      });
    }

    const [totalNotes, totalStudentsReached] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder
        .select('SUM(note.studentCount)', 'total')
        .getRawOne()
        .then((result) => parseInt(result.total) || 0),
    ]);

    return {
      totalNotes,
      totalStudentsReached,
    };
  }
}
