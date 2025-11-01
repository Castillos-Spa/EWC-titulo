import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/features/auth/guards/permissions.guard';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  create(@Body() createTransportRouteDto: CreateRouteDto) {
    return this.routesService.create(createTransportRouteDto);
  }

  @Get()
  findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    paginationQuery: PaginationQueryDto,
  ) {
    return this.routesService.findAll(paginationQuery);
  }

  @Get('assignments')
  findAllAssignments(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    paginationQuery: PaginationQueryDto,
  ) {
    return this.routesService.findAllAssignments(paginationQuery);
  }

  @Post('assignments')
  createAssignment(@Body() createAssignmentDto: any) {
    return this.routesService.createAssignment(createAssignmentDto);
  }

  @Delete('assignments/:id')
  removeAssignment(@Param('id', ParseIntPipe) id: number) {
    return this.routesService.removeAssignment(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTransportRouteDto: UpdateRouteDto) {
    return this.routesService.update(+id, updateTransportRouteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routesService.remove(+id);
  }
}
