import { Controller, Get, Post, Put, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';
import { AzureUserSyncService } from './azure-user-sync.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UserController {
	constructor(
		private readonly userService: UserService,
		private readonly azureUserSyncService: AzureUserSyncService,
	) {}

	@Post()
	async create(@Body() createUserDto: CreateUserDto): Promise<User> {
		return this.userService.createUser(createUserDto);
	}

	@Get()
	async findAll(): Promise<User[]> {
		return this.userService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: number): Promise<User | null> {
		return this.userService.findOne(Number(id));
	}

	// Get user profile by email (for login authentication)
	@Get('profile/:email')
	async getUserProfile(@Param('email') email: string): Promise<User | null> {
		try {
			const user = await this.userService.findByEmail(email);
			
			if (!user) {
				throw new HttpException('User not found', HttpStatus.NOT_FOUND);
			}
			
			return user;
		} catch (error) {
			throw new HttpException(
				{
					success: false,
					message: 'Failed to fetch user profile',
					error: error.message
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}
  // Azure AD login: auto-create user with role 'student' if not exists
  @Post('azure-login')
  async azureLogin(@Body() body: { email: string; displayName?: string; azureId?: string }): Promise<User> {
    console.log('Azure login data received:', body); // Debug log
    
    // Try to find user by email
    let user = await this.userService.findByEmail(body.email);
    if (!user) {
      // Create new user with role 'student' and Azure info
      user = await this.userService.create({
        email: body.email,
        display_name: body.displayName || undefined,
        azureId: body.azureId || undefined,
        role: 'student',
        contactNumber: undefined,
      });
      console.log('New user created:', user);
    } else {
      // Update existing user with Azure info if missing
      if (!user.azureId && body.azureId) {
        user.azureId = body.azureId;
      }
      if (!user.display_name && body.displayName) {
        user.display_name = body.displayName;
      }
      user = await this.userService.update(user.id, user);
      console.log('User updated:', user);
    }
    return user!; // Non-null assertion since user is guaranteed to exist here
  }	@Put(':id')
	async update(@Param('id') id: number, @Body() updateData: Partial<User>): Promise<User | null> {
		// If updating role, add basic validation
		if (updateData.role) {
			const validRoles = ['student', 'teacher', 'admin'];
			if (!validRoles.includes(updateData.role)) {
				throw new HttpException('Invalid role specified', HttpStatus.BAD_REQUEST);
			}
		}
		return this.userService.update(Number(id), updateData);
	}

	@Delete(':id')
	async remove(@Param('id') id: number): Promise<void> {
		return this.userService.remove(Number(id));
	}

	// Azure AD Integration Endpoints
	@Post('sync-azure-users')
	async syncAzureUsers() {
		try {
			const result = await this.azureUserSyncService.syncAzureUsersToDb();
			return {
				success: true,
				message: 'Azure AD users synced successfully',
				...result
			};
		} catch (error) {
			throw new HttpException(
				{
					success: false,
					message: 'Failed to sync Azure AD users',
					error: error.message
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	@Get('azure-synced')
	async getAzureSyncedUsers(): Promise<User[]> {
		return this.userService.getAllAzureSyncedUsers();
	}

	@Get('azure/:azureId')
	async getAzureUser(@Param('azureId') azureId: string) {
		try {
			const azureUser = await this.azureUserSyncService.getAzureUserById(azureId);
			const localUser = await this.userService.findByAzureId(azureId);
			
			return {
				azureUser,
				localUser
			};
		} catch (error) {
			throw new HttpException(
				{
					success: false,
					message: 'Failed to fetch Azure user',
					error: error.message
				},
				HttpStatus.NOT_FOUND
			);
		}
	}
}
