import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './class.entity';

@Injectable()
export class ClassService {
	constructor(
		@InjectRepository(Class)
		private readonly classRepository: Repository<Class>,
	) {}

	async create(cls: Partial<Class>): Promise<Class> {
		return this.classRepository.save(cls);
	}

	async findAll(): Promise<Class[]> {
		return this.classRepository.find();
	}

	async findOne(id: number): Promise<Class | null> {
		return this.classRepository.findOne({ where: { id } });
	}

	async update(id: number, cls: Partial<Class>): Promise<Class | null> {
		await this.classRepository.update(id, cls);
		return this.findOne(id);
	}

	async remove(id: number): Promise<void> {
		await this.classRepository.delete(id);
	}
}
