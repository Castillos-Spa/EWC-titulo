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
import { RutasService } from './rutas.service';
import { CreateRutaDto } from './dto/create-ruta.dto';
import { UpdateRutaDto } from './dto/update-ruta.dto';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/features/auth/guards/permissions.guard';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('rutas')
export class RutasController {
  constructor(private readonly rutasService: RutasService) {}

  @Post()
  create(@Body() createTransportRouteDto: CreateRutaDto) {
    return this.rutasService.create(createTransportRouteDto);
  }

  @Get()
  findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    paginationQuery: PaginationQueryDto,
  ) {
    return this.rutasService.findAll(paginationQuery);
  }

  @Get('assignments')
  findAllAssignments(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    paginationQuery: PaginationQueryDto,
  ) {
    return this.rutasService.findAllAssignments(paginationQuery);
  }

  @Post('assignments')
  createAssignment(@Body() createAssignmentDto: any) {
    // Nota: Deberías crear un CreateAssignmentDto para validar el cuerpo de la petición.
    return this.rutasService.createAssignment(createAssignmentDto);
  }

  @Delete('assignments/:id')
  removeAssignment(@Param('id', ParseIntPipe) id: number) {
    return this.rutasService.removeAssignment(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rutasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTransportRouteDto: UpdateRutaDto) {
    return this.rutasService.update(+id, updateTransportRouteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rutasService.remove(+id);
  }
}
