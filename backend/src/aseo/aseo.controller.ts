import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AseoService } from './aseo.service';
import { CreateAseoDto } from './dto/create-aseo.dto';
import { UpdateAseoDto } from './dto/update-aseo.dto';

@Controller('aseo')
export class AseoController {
  constructor(private readonly aseoService: AseoService) {}

  @Post()
  create(@Body() createAseoDto: CreateAseoDto) {
    return this.aseoService.create(createAseoDto);
  }

  @Get()
  findAll(@Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    const p = Math.max(Number(page) || 1, 1);
    const size = Math.min(Math.max(Number(pageSize) || 20, 1), 200);
    return this.aseoService.findAll({ page: p, pageSize: size });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aseoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAseoDto: UpdateAseoDto) {
    return this.aseoService.update(+id, updateAseoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aseoService.remove(+id);
  }
}
