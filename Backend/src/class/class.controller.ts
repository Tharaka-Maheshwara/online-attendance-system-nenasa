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
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Controller('class')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  async create(@Body() createClassDto: CreateClassDto) {
    return this.classService.create(createClassDto);
  }

  @Get()
  async findAll() {
    return this.classService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.classService.findOne(Number(id));
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateClassDto: UpdateClassDto,
  ) {
    return this.classService.update(Number(id), updateClassDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    return this.classService.remove(Number(id));
  }
}
