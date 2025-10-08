import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
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
  findAll() {
    return this.aseoService.findAll();
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
