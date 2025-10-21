import { Controller, Get, Post, Body, Param, Patch, Delete, Query, ValidationPipe } from '@nestjs/common';
import { IncidentService } from './incident.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';

@Controller('incident')
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @Post()
  create(@Body() createIncidentDto: CreateIncidentDto) {
    return this.incidentService.create(createIncidentDto);
  }

  @Get()
  findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    paginationQuery: PaginationQueryDto,
  ) {
    return this.incidentService.findAll(paginationQuery);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentService.findOne(Number(id));
  }

  @Get(':id/photos')
  async getPhotos(@Param('id') id: string) {
    const incident = await this.incidentService.findOne(Number(id));
    // Return only the photos field to avoid large payloads elsewhere
    return { id: incident.id, photos: incident.photos || [] };
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
