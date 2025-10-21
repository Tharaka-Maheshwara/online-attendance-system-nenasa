import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

export interface AzureUserDto {
  email: string;
  displayName: string;
  azureId: string;
  register_number?: string;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // Duplicate email check
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new Error('Email already exists');
    }
    const user = this.userRepository.create({
      ...createUserDto,
      role: (createUserDto.role as UserRole) || 'user',
    });
    return this.userRepository.save(user);
  }

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

  async findByRegisterNumber(registerNumber: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { register_number: registerNumber },
    });
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

      // Ensure register_number is extracted if not provided or empty
      let registerNumber = azureUserDto.register_number;
      if (!registerNumber && azureUserDto.email) {
        registerNumber = azureUserDto.email.split('@')[0];
        this.logger.log(
          `Extracted register_number '${registerNumber}' from email '${azureUserDto.email}'`,
        );
      }

      const userData: Partial<User> = {
        email: azureUserDto.email,
        display_name: azureUserDto.displayName,
        azureId: azureUserDto.azureId,
        register_number: registerNumber,
        // Set default role if creating new user
        role: existingUser?.role || 'user',
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
        this.logger.log(
          `Created new user from Azure: ${azureUserDto.email} with register_number: ${registerNumber}`,
        );
        return savedUser;
      }
    } catch (error) {
      // Handle duplicate key errors gracefully
      if (
        error.code === 'ER_DUP_ENTRY' ||
        error.message.includes('Duplicate entry')
      ) {
        this.logger.warn(
          `Duplicate user detected for ${azureUserDto.email}, attempting to find existing user`,
        );

        // Try to find existing user by email as fallback
        const existingUser = await this.findByEmail(azureUserDto.email);
        if (existingUser) {
          this.logger.log(`Returning existing user: ${azureUserDto.email}`);
          return existingUser;
        }
      }

      this.logger.error(
        `Failed to create/update user from Azure: ${azureUserDto.email}`,
        error,
      );
      throw error;
    }
  }

  async getAllAzureSyncedUsers(): Promise<User[]> {
    return this.userRepository.find({
      where: { azureId: Not(IsNull()) },
      order: { updatedAt: 'DESC' },
    });
  }
}
