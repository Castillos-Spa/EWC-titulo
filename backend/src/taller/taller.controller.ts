import { Controller, Post, Body, Param, ParseIntPipe, Get, NotFoundException, Patch } from '@nestjs/common';
import { TallerService } from './taller.service';
import { CreateOrdenTrabajoTallerDto } from './dto/create-taller.dto';
import { CreateVehiculoDto } from '../vehiculo/dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from '../vehiculo/dto/update-vehiculo.dto';

@Controller('taller')
export class TallerController {
  constructor(private readonly tallerService: TallerService) {}

  @Post('orden-trabajo')
  crearOrdenTrabajo(@Body() createOrdenTrabajoTallerDto: CreateOrdenTrabajoTallerDto) {
    return this.tallerService.crearOrdenTrabajo(createOrdenTrabajoTallerDto);
  }

  @Patch('orden-trabajo/:otId/cerrar') // Debería ser PATCH, pero sigo tu implementación actual
  cerrarOrdenTrabajo(
    @Param('otId', ParseIntPipe) otId: number,
    @Body('checklist') checklist: string,
    @Body('resultado') resultado: string,
  ) {
    return this.tallerService.cerrarOrdenTrabajo(otId, checklist, resultado);
  }

  @Post('vehiculos')
  createVehiculo(@Body() createVehiculoDto: CreateVehiculoDto) {
    return this.tallerService.crearVehiculo(createVehiculoDto);
  }

  @Patch('vehiculos/:id')
  updateVehiculo(@Param('id', ParseIntPipe) id: number, @Body() updateVehiculoDto: UpdateVehiculoDto) {
    return this.tallerService.updateVehiculo(id, updateVehiculoDto);
  }

  @Get('vehiculos')
  findAllVehiculos() {
    return this.tallerService.obtenerVehiculosDisponibles();
  }

  @Get('vehiculos/:patente')
  async findOneVehiculo(@Param('patente') patente: string) {
    const vehiculo = await this.tallerService.findOneVehiculo(patente);
    if (!vehiculo) {
      throw new NotFoundException(`Vehículo con patente ${patente} no encontrado`);
    }
    return vehiculo;
  }
}
