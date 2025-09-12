import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { OrdenTrabajoService } from './orden-trabajo.service';
import { CreateOrdenTrabajoDto } from './dto/create-orden-trabajo.dto';
import { UpdateOrdenTrabajoDto } from './dto/update-orden-trabajo.dto';
import { CreateQADto } from '@/qa/dto/create-qa.dto';

@Controller('orden-trabajo')
export class OrdenTrabajoController {
  constructor(private readonly ordenTrabajoService: OrdenTrabajoService) {}

  @Post()
  create(@Body() createOrdenTrabajoDto: CreateOrdenTrabajoDto) {
    return this.ordenTrabajoService.create(createOrdenTrabajoDto);
  }

  @Get()
  findAll() {
    return this.ordenTrabajoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordenTrabajoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrdenTrabajoDto: UpdateOrdenTrabajoDto) {
    return this.ordenTrabajoService.update(+id, updateOrdenTrabajoDto);
  }

  @Post(':id/tareas')
  planificarTareas(@Param('id') id: string, @Body() tareasDto: { tareas: string[] }) {
    return this.ordenTrabajoService.planificarTareas(+id, tareasDto.tareas);
  }

  @Post(':id/responsable')
  asignarResponsable(@Param('id') id: string, @Body() responsableDto: { responsableId: number }) {
    return this.ordenTrabajoService.asignarResponsable(+id, responsableDto.responsableId);
  }

  @Post(':id/cerrar')
  cerrarOT(@Param('id') id: string, @Body() createQADto: CreateQADto) {
    return this.ordenTrabajoService.cerrarOT(+id, createQADto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordenTrabajoService.remove(+id);
  }
}
