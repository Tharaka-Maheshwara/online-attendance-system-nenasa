import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { Role } from './role.entity';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  async create(@Body() role: Partial<Role>): Promise<Role> {
    return this.roleService.create(role);
  }

  @Get()
  async findAll(): Promise<Role[]> {
    return this.roleService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Role | null> {
    return this.roleService.findOne(Number(id));
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() role: Partial<Role>,
  ): Promise<Role | null> {
    return this.roleService.update(Number(id), role);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    return this.roleService.remove(Number(id));
  }
}
