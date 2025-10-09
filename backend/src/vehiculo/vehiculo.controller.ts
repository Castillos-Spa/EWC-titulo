import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { VehiculoService } from './vehiculo.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';

@Controller('vehiculo')
export class VehiculoController {
  constructor(private readonly vehiculoService: VehiculoService) {}

  @Post()
  create(@Body() createVehiculoDto: CreateVehiculoDto) {
    return this.vehiculoService.create(createVehiculoDto);
  }

  @Get()
  findAll(@Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    const skip = (Number(page) - 1) * Number(pageSize);
    return this.vehiculoService.findAll({ skip, take: Number(pageSize), orderBy: { id: 'desc' } });
  }

  @Get(':patente')
  findOne(@Param('patente') patente: string) {
    return this.vehiculoService.findByPatente(patente);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateVehiculoDto: UpdateVehiculoDto) {
    return this.vehiculoService.update(id, updateVehiculoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehiculoService.remove(+id);
  }

  @Post(':id/documentos')
  registrarDocumento(
    @Param('id') vehiculoId: string,
    @Body() data: { tipo: string; url: string; descripcion?: string },
  ) {
    return this.vehiculoService.registrarDocumento(+vehiculoId, data.tipo, data.url, data.descripcion);
  }
}
