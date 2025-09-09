import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './attendance.entity';

@Injectable()
export class AttendanceService {
	constructor(
		@InjectRepository(Attendance)
		private readonly attendanceRepository: Repository<Attendance>,
	) {}

	async create(att: Partial<Attendance>): Promise<Attendance> {
		return this.attendanceRepository.save(att);
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
}
