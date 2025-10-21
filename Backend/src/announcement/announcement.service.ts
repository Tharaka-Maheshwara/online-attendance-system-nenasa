import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './announcement.entity';

export interface CreateAnnouncementDto {
  classId: number;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  teacherEmail: string;
  studentIds: number[];
}

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectRepository(Announcement)
    private announcementRepository: Repository<Announcement>,
  ) {}

  async createAnnouncement(createAnnouncementDto: CreateAnnouncementDto): Promise<Announcement> {
    const { classId, title, message, priority, teacherEmail, studentIds } = createAnnouncementDto;

    if (!classId || !title || !message || !teacherEmail || !studentIds || studentIds.length === 0) {
      throw new BadRequestException('Missing required fields');
    }

    const announcement = this.announcementRepository.create({
      classId,
      title: title.trim(),
      message: message.trim(),
      priority,
      teacherEmail,
      studentIds,
      recipientCount: studentIds.length,
    });

    return await this.announcementRepository.save(announcement);
  }

  async getAnnouncementsByTeacher(teacherEmail: string): Promise<Announcement[]> {
    return await this.announcementRepository.find({
      where: { teacherEmail },
      order: { createdAt: 'DESC' },
    });
  }

  async getAnnouncementsForStudent(studentId: number): Promise<Announcement[]> {
    const announcements = await this.announcementRepository
      .createQueryBuilder('announcement')
      .where('JSON_CONTAINS(announcement.studentIds, :studentId)', {
        studentId: JSON.stringify(studentId),
      })
      .orderBy('announcement.createdAt', 'DESC')
      .getMany();

    return announcements;
  }

  async getAllAnnouncements(): Promise<Announcement[]> {
    return await this.announcementRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getAnnouncementById(id: number): Promise<Announcement> {
    const announcement = await this.announcementRepository.findOne({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return announcement;
  }

  async deleteAnnouncement(id: number, teacherEmail: string): Promise<void> {
    const announcement = await this.getAnnouncementById(id);

    if (announcement.teacherEmail !== teacherEmail) {
      throw new BadRequestException('You can only delete your own announcements');
    }

    await this.announcementRepository.delete(id);
  }

  async getAnnouncementStats(teacherEmail?: string): Promise<any> {
    const queryBuilder = this.announcementRepository.createQueryBuilder('announcement');

    if (teacherEmail) {
      queryBuilder.where('announcement.teacherEmail = :teacherEmail', { teacherEmail });
    }

    const total = await queryBuilder.getCount();
    
    const priorityStats = await queryBuilder
      .select('announcement.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('announcement.priority')
      .getRawMany();

    const recentCount = await queryBuilder
      .where('announcement.createdAt >= :date', {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      })
      .getCount();

    return {
      total,
      recentCount,
      priorityStats: priorityStats.reduce((acc, stat) => {
        acc[stat.priority] = parseInt(stat.count);
        return acc;
      }, {}),
    };
  }
}