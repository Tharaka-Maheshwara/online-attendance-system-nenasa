import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './attendance.entity';
import { NotificationService } from '../notification/notification.service';
import { User } from '../user/user.entity';

@Injectable()
export class AttendanceService {
	constructor(
		@InjectRepository(Attendance)
		private readonly attendanceRepository: Repository<Attendance>,
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		private readonly notificationService: NotificationService,
	) {}

	async create(att: Partial<Attendance>): Promise<Attendance> {
		const attendance = await this.attendanceRepository.save(att);
		
		// Send notification after attendance is marked
		await this.sendAttendanceNotification(attendance);
		
		return attendance;
	}

	async findAll(): Promise<Attendance[]> {
		return this.attendanceRepository.find();
	}

	async findOne(id: number): Promise<Attendance | null> {
		return this.attendanceRepository.findOne({ where: { id } });
	}

	async update(id: number, att: Partial<Attendance>): Promise<Attendance | null> {
		await this.attendanceRepository.update(id, att);
		return this.findOne(id);
	}

	async remove(id: number): Promise<void> {
		await this.attendanceRepository.delete(id);
	}

	async findByClass(classId: number): Promise<Attendance[]> {
		return this.attendanceRepository.find({ 
			where: { classId },
			order: { date: 'DESC', createdAt: 'DESC' }
		});
	}

	async findByStudent(studentId: number): Promise<Attendance[]> {
		return this.attendanceRepository.find({ 
			where: { studentId },
			order: { date: 'DESC', createdAt: 'DESC' }
		});
	}

	async findByClassAndDate(classId: number, date: string): Promise<Attendance[]> {
		return this.attendanceRepository.find({ 
			where: { classId, date },
			order: { createdAt: 'DESC' }
		});
	}

	private async sendAttendanceNotification(attendance: Attendance): Promise<void> {
		try {
			// Get student information
			const student = await this.userRepository.findOne({ 
				where: { id: attendance.studentId } 
			});

			if (!student || !student.parentEmail) {
				console.log(`No parent email found for student ID: ${attendance.studentId}`);
				return;
			}

			// Send notification
			await this.notificationService.sendAttendanceNotification(
				student.display_name || 'Student',
				student.parentEmail,
				attendance.classId,
				attendance.studentId,
				attendance.status === 'present',
				attendance.date
			);
		} catch (error) {
			console.error('Error sending attendance notification:', error);
		}
	}

	async markAbsentStudents(classId: number, date: string, presentStudentIds: number[]): Promise<void> {
		// Get all students in the class
		const allStudents = await this.userRepository.find({
			where: { role: 'student' }
			// You might need to add class relationship here based on your data model
		});

		// Find absent students
		const absentStudents = allStudents.filter(student => 
			!presentStudentIds.includes(student.id)
		);

		// Mark absent and send notifications
		for (const student of absentStudents) {
			const existingAttendance = await this.attendanceRepository.findOne({
				where: { studentId: student.id, classId, date }
			});

			if (!existingAttendance) {
				// Create absent attendance record
				const absentAttendance = await this.attendanceRepository.save({
					studentId: student.id,
					classId,
					date,
					status: 'absent',
					markedAt: new Date(),
				});

				// Send notification for absent student
				await this.sendAttendanceNotification(absentAttendance);
			}
		}
	}
}
