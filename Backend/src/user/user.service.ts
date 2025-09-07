import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
	) {}

	async create(user: Partial<User>): Promise<User> {
		return this.userRepository.save(user);
	}

	async findAll(): Promise<User[]> {
		return this.userRepository.find();
	}

		async findOne(id: number): Promise<User | null> {
			return this.userRepository.findOne({ where: { id } });
		}

		async update(id: number, user: Partial<User>): Promise<User | null> {
			await this.userRepository.update(id, user);
			return this.findOne(id);
		}

	async remove(id: number): Promise<void> {
		await this.userRepository.delete(id);
	}
}
