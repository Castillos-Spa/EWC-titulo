import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { QaService } from './qa.service';
import { CreateQADto } from './dto/create-qa.dto';

@Controller('qa')
export class QaController {
  constructor(private readonly qaService: QaService) {}

  @Post()
  create(@Body() createQADto: CreateQADto) {
    return this.qaService.create(createQADto);
  }

  @Get()
  findAll() {
    return this.qaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.qaService.findOne(id);
  }

  @Post(':otId/bloquear')
  bloquearLiberacion(@Param('otId', ParseIntPipe) otId: number) {
    return this.qaService.bloquearLiberacion(otId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.qaService.remove(id);
  }
}
