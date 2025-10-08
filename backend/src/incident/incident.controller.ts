import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { IncidentService } from './incident.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';

@Controller('incident')
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @Post()
  create(@Body() createIncidentDto: CreateIncidentDto) {
    return this.incidentService.create(createIncidentDto);
  }

  @Get()
  findAll(@Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    const p = Math.max(Number(page) || 1, 1);
    const size = Math.min(Math.max(Number(pageSize) || 20, 1), 200);
    return this.incidentService.findAll({ page: p, pageSize: size });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIncidentDto: UpdateIncidentDto) {
    return this.incidentService.update(Number(id), updateIncidentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incidentService.remove(Number(id));
  }
}
