import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Get,
  NotFoundException,
  Patch,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { TallerService } from './taller.service';
import { CreateOrdenTrabajoTallerDto } from '../orden-trabajo/dto/create-orden-trabajo.dto';
import { CreateVehiculoDto } from '../vehiculo/dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from '../vehiculo/dto/update-vehiculo.dto';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';

@Controller('taller')
export class TallerController {
  constructor(private readonly tallerService: TallerService) {}

  @Post('orden-trabajo')
  crearOrdenTrabajo(@Body() createOrdenTrabajoTallerDto: CreateOrdenTrabajoTallerDto) {
    return this.tallerService.crearOrdenTrabajo(createOrdenTrabajoTallerDto);
  }

  @Get('orden-trabajo')
  findAllWorkOrders(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    paginationQuery: PaginationQueryDto,
  ) {
    return this.tallerService.findAllWorkOrders(paginationQuery);
  }

  @Patch('orden-trabajo/:id/status')
  updateWorkOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWorkOrderStatusDto: UpdateWorkOrderStatusDto,
  ) {
    return this.tallerService.updateWorkOrderStatus(id, updateWorkOrderStatusDto.estado);
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

  @Get('vehiculos/:patente')
  async findOneVehiculo(@Param('patente') patente: string) {
    const vehiculo = await this.tallerService.findOneVehiculo(patente);
    if (!vehiculo) {
      throw new NotFoundException(`Vehículo con patente ${patente} no encontrado`);
    }
    return vehiculo;
  }
}
