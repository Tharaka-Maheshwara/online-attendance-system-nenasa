import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';

@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Post()
	async create(@Body() user: Partial<User>): Promise<User> {
		return this.userService.create(user);
	}

	@Get()
	async findAll(): Promise<User[]> {
		return this.userService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: number): Promise<User | null> {
		return this.userService.findOne(Number(id));
	}

	@Put(':id')
	async update(@Param('id') id: number, @Body() user: Partial<User>): Promise<User | null> {
		return this.userService.update(Number(id), user);
	}

	@Delete(':id')
	async remove(@Param('id') id: number): Promise<void> {
		return this.userService.remove(Number(id));
	}
}
