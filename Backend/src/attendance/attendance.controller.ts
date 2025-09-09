import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Attendance } from './attendance.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
	constructor(private readonly attendanceService: AttendanceService) {}

	@Post()
	async create(@Body() att: Partial<Attendance>): Promise<Attendance> {
		return this.attendanceService.create(att);
	}

	@Get()
	async findAll(): Promise<Attendance[]> {
		return this.attendanceService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: number): Promise<Attendance | null> {
		return this.attendanceService.findOne(Number(id));
	}

	@Put(':id')
	async update(@Param('id') id: number, @Body() att: Partial<Attendance>): Promise<Attendance | null> {
		return this.attendanceService.update(Number(id), att);
	}

	@Delete(':id')
	async remove(@Param('id') id: number): Promise<void> {
		return this.attendanceService.remove(Number(id));
	}
}
