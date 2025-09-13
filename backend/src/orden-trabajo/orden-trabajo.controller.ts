import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { OrdenTrabajoService } from './orden-trabajo.service';
import { CreateOrdenTrabajoDto } from './dto/create-orden-trabajo.dto';
import { UpdateOrdenTrabajoDto } from './dto/update-orden-trabajo.dto';

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
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordenTrabajoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateOrdenTrabajoDto: UpdateOrdenTrabajoDto) {
    return this.ordenTrabajoService.update(id, updateOrdenTrabajoDto);
  }

  @Post(':id/tareas')
  planificarTareas(@Param('id', ParseIntPipe) id: number, @Body() tareasDto: { tareas: string[] }) {
    return this.ordenTrabajoService.planificarTareas(id, tareasDto.tareas);
  }

  @Post(':id/responsable')
  asignarResponsable(@Param('id', ParseIntPipe) id: number, @Body() responsableDto: { responsableId: number }) {
    return this.ordenTrabajoService.asignarResponsable(id, responsableDto.responsableId);
  }

  @Post(':id/cerrar')
  cerrarOT(@Param('id', ParseIntPipe) id: number, @Body() body: { checklist: string; resultado: string }) {
    return this.ordenTrabajoService.cerrarOT(id, body.checklist, body.resultado);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ordenTrabajoService.remove(id);
  }
}
