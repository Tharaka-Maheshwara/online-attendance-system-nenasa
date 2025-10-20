import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';
import { AzureUserSyncService } from './azure-user-sync.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

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
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get user information by register_number for auto-fill functionality
  @Get('by-register/:registerNumber')
  async getUserByRegisterNumber(
    @Param('registerNumber') registerNumber: string,
  ) {
    try {
      const user = await this.userService.findByRegisterNumber(registerNumber);

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          register_number: user.register_number,
          role: user.role,
          contactNumber: user.contactNumber,
          parentName: user.parentName,
          parentEmail: user.parentEmail,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch user by register number',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Azure AD login: auto-create user with role 'user' if not exists
  @Post('azure-login')
  async azureLogin(
    @Body() body: { email: string; displayName?: string; azureId?: string },
  ): Promise<User> {
    console.log('Azure login data received:', body); // Debug log

    // Extract register_number from email (userPrincipalName)
    const registerNumber = body.email ? body.email.split('@')[0] : '';
    
    console.log('Extracted register_number:', registerNumber); // Debug log

    // Try to find user by email
    let user = await this.userService.findByEmail(body.email);
    if (!user) {
      // Create new user with role 'user' and Azure info
      user = await this.userService.create({
        email: body.email,
        display_name: body.displayName || undefined,
        azureId: body.azureId || undefined,
        register_number: registerNumber,
        role: 'user',
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
      // Update register_number if not set
      if (!user.register_number && registerNumber) {
        user.register_number = registerNumber;
      }
      user = await this.userService.update(user.id, user);
      console.log('User updated:', user);
    }
    return user!; // Non-null assertion since user is guaranteed to exist here
  }
  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateData: Partial<User>,
  ): Promise<User | null> {
    // If updating role, add basic validation
    if (updateData.role) {
      const validRoles = ['student', 'teacher', 'admin', 'user'];
      if (!validRoles.includes(updateData.role)) {
        throw new HttpException(
          'Invalid role specified',
          HttpStatus.BAD_REQUEST,
        );
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
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to sync Azure AD users',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
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
      const azureUser =
        await this.azureUserSyncService.getAzureUserById(azureId);
      const localUser = await this.userService.findByAzureId(azureId);

      return {
        azureUser,
        localUser,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch Azure user',
          error: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post(':id/assign-role')
  async assignRole(@Param('id') id: number, @Body() body: { role: string }) {
    try {
      const user = await this.userService.findOne(Number(id));

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Update user role
      user.role = body.role as any;
      const updatedUser = await this.userService.update(Number(id), {
        role: body.role as any,
      });

      if (!updatedUser) {
        throw new HttpException(
          'Failed to update user',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Create a request to add to role-specific table
      const response = await fetch(
        'http://localhost:8000/users/handle-role-assignment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: updatedUser.id,
            role: body.role,
          }),
        },
      );

      if (!response.ok) {
        this.logger.warn(
          `Failed to add user to role table: ${response.statusText}`,
        );
      }

      return {
        success: true,
        message: `User role updated to ${body.role}`,
        user: updatedUser,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to assign role',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('handle-role-assignment')
  async handleRoleAssignment(@Body() body: { userId: number; role: string }) {
    try {
      const user = await this.userService.findOne(body.userId);

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (body.role === 'student') {
        // Call student service to create student record
        const response = await fetch('http://localhost:8000/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: user.register_number || `STU-${user.id}`,
            user_id: user.id,
            guardian_name: user.parentName,
            guardian_email: user.parentEmail,
            is_active: true,
          }),
        });

        if (response.ok) {
          return { success: true, message: 'Student record created' };
        }
      } else if (body.role === 'teacher') {
        // Call teacher service to create teacher record
        const response = await fetch('http://localhost:8000/teachers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teacher_id: user.register_number || `TEA-${user.id}`,
            user_id: user.id,
            phone_number: user.contactNumber,
            is_active: true,
          }),
        });

        if (response.ok) {
          return { success: true, message: 'Teacher record created' };
        }
      }

      return { success: false, message: 'Role assignment failed' };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to handle role assignment',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Fix NULL register_numbers for existing users
  @Post('fix-register-numbers')
  async fixRegisterNumbers() {
    try {
      this.logger.log('Starting to fix NULL register_numbers...');
      
      // Get all users with NULL register_number
      const usersWithoutRegisterNumber = await this.userService.findAll();
      const nullRegisterUsers = usersWithoutRegisterNumber.filter(user => !user.register_number);
      
      this.logger.log(`Found ${nullRegisterUsers.length} users with NULL register_number`);
      
      let fixedCount = 0;
      
      for (const user of nullRegisterUsers) {
        if (user.email) {
          // Extract register_number from email
          const registerNumber = user.email.split('@')[0];
          
          if (registerNumber && registerNumber !== user.email) {
            // Update the user
            await this.userService.update(user.id, {
              register_number: registerNumber
            });
            
            this.logger.log(`Fixed user ${user.email} - set register_number to: ${registerNumber}`);
            fixedCount++;
          } else {
            this.logger.warn(`Could not extract register_number from email: ${user.email}`);
          }
        }
      }
      
      return {
        success: true,
        message: `Fixed ${fixedCount} users with NULL register_numbers`,
        totalProcessed: nullRegisterUsers.length,
        fixed: fixedCount
      };
    } catch (error) {
      this.logger.error('Error fixing register numbers:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fix register numbers',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
