import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VehiculoService } from './vehiculo.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';

@Controller('vehiculo')
export class VehiculoController {
  constructor(private readonly vehiculoService: VehiculoService) {}

  @Post()
  create(@Body() createVehiculoDto: CreateVehiculoDto) {
    return this.vehiculoService.createVehiculos(createVehiculoDto);
  }

  @Get()
  findAll() {
    return this.vehiculoService.findAllVehiculos();
  }

  @Get(':patente')
  findOne(@Param('patente') patente: string) {
    return this.vehiculoService.findOneVehiculos(patente);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVehiculoDto: UpdateVehiculoDto) {
    return this.vehiculoService.updateVehiculo(+id, updateVehiculoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehiculoService.removeVehiculo(+id);
  }

  @Post(':id/documentos')
  registrarDocumento(
    @Param('id') vehiculoId: string,
    @Body() data: { tipo: string; url: string; descripcion?: string },
  ) {
    return this.vehiculoService.registrarDocumento(+vehiculoId, data.tipo, data.url, data.descripcion);
  }
}
