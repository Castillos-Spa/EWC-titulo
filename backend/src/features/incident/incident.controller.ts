import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { IncidentService } from './incident.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/features/auth/guards/roles.guard';
import { Roles } from '@/features/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { SimpleCacheInterceptor } from '@/common/simple-cache.interceptor';
import { CacheTTL } from '@/common/cache-ttl.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('incident')
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @Post()
  @Roles(Role.Admin, Role.Supervisor, Role.Jefe)
  create(@Body() createIncidentDto: CreateIncidentDto, @Request() req: any) {
    return this.incidentService.create(createIncidentDto, req.user.userId);
  }

  @Get()
  @UseInterceptors(SimpleCacheInterceptor)
  @CacheTTL(30)
  findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    paginationQuery: PaginationQueryDto,
  ) {
    return this.incidentService.findAll(paginationQuery);
  }

  @Get(':id')
  @UseInterceptors(SimpleCacheInterceptor)
  @CacheTTL(30)
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
  @Roles(Role.Admin, Role.Supervisor, Role.Jefe)
  update(@Param('id') id: string, @Body() updateIncidentDto: UpdateIncidentDto) {
    return this.incidentService.update(Number(id), updateIncidentDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Jefe)
  remove(@Param('id') id: string) {
    return this.incidentService.remove(Number(id));
  }
}
