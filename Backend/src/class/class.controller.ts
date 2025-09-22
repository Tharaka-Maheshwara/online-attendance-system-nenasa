import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ClassService } from './class.service';
import { Class } from './class.entity';

@Controller('class')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  async create(@Body() cls: Partial<Class>): Promise<Class> {
    return this.classService.create(cls);
  }

  @Get()
  async findAll(): Promise<Class[]> {
    return this.classService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Class | null> {
    return this.classService.findOne(Number(id));
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() cls: Partial<Class>,
  ): Promise<Class | null> {
    return this.classService.update(Number(id), cls);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    return this.classService.remove(Number(id));
  }
}
