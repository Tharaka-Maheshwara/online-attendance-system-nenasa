import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';

@Injectable()
export class RoleService {
	constructor(
		@InjectRepository(Role)
		private readonly roleRepository: Repository<Role>,
	) {}

	async create(role: Partial<Role>): Promise<Role> {
		return this.roleRepository.save(role);
	}

	async findAll(): Promise<Role[]> {
		return this.roleRepository.find();
	}

	async findOne(id: number): Promise<Role | null> {
		return this.roleRepository.findOne({ where: { id } });
	}

	async update(id: number, role: Partial<Role>): Promise<Role | null> {
		await this.roleRepository.update(id, role);
		return this.findOne(id);
	}

	async remove(id: number): Promise<void> {
		await this.roleRepository.delete(id);
	}
}
