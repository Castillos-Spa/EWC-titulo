import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { RutasService } from './rutas.service';
import { CreateRutaDto } from './dto/create-ruta.dto';
import { UpdateRutaDto } from './dto/update-ruta.dto';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/features/auth/guards/permissions.guard';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('rutas')
export class RutasController {
  constructor(private readonly rutasService: RutasService) {}

  @Post()
  create(@Body() createTransportRouteDto: CreateRutaDto) {
    return this.rutasService.create(createTransportRouteDto);
  }

  @Get()
  findAll() {
    return this.rutasService.findAll();
  }

  @Get('assignments')
  findAllAssignments() {
    return this.rutasService.findAllAssignments();
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
