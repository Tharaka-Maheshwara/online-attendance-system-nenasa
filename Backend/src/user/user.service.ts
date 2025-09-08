import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { User } from './user.entity';

export interface AzureUserDto {
  email: string;
  displayName: string;
  azureId: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  department?: string;
  userPrincipalName: string;
}

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);

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

	async findByEmail(email: string): Promise<User | null> {
		return this.userRepository.findOne({ where: { email } });
	}

	async findByAzureId(azureId: string): Promise<User | null> {
		return this.userRepository.findOne({ where: { azureId } });
	}

	async createOrUpdateFromAzure(azureUserDto: AzureUserDto): Promise<User> {
		try {
			// Check if user exists by Azure ID or email
			let existingUser = await this.findByAzureId(azureUserDto.azureId);
			
			if (!existingUser) {
				existingUser = await this.findByEmail(azureUserDto.email);
			}

			const userData = {
				email: azureUserDto.email,
				name: azureUserDto.displayName,
				azureId: azureUserDto.azureId,
				firstName: azureUserDto.firstName,
				lastName: azureUserDto.lastName,
				userPrincipalName: azureUserDto.userPrincipalName,
				// Set default role if creating new user
				role: existingUser?.role || 'student',
				// Update sync timestamp
				lastAzureSync: new Date(),
			};

			if (existingUser) {
				// Update existing user
				await this.userRepository.update(existingUser.id, userData);
				this.logger.log(`Updated existing user: ${azureUserDto.email}`);
				const updatedUser = await this.findOne(existingUser.id);
				return updatedUser!;
			} else {
				// Create new user
				const newUser = this.userRepository.create(userData);
				const savedUser = await this.userRepository.save(newUser);
				this.logger.log(`Created new user from Azure: ${azureUserDto.email}`);
				return savedUser;
			}
		} catch (error) {
			this.logger.error(`Failed to create/update user from Azure: ${azureUserDto.email}`, error);
			throw error;
		}
	}

	async getAllAzureSyncedUsers(): Promise<User[]> {
		return this.userRepository.find({ 
			where: { azureId: Not(IsNull()) },
			order: { lastAzureSync: 'DESC' }
		});
	}
}
