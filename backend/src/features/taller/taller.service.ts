import { Inject, Injectable } from '@nestjs/common';
import { OrdenTrabajoService, OrdenTrabajoEstado } from '../orden-trabajo/orden-trabajo.service';
import { CreateOrdenTrabajoTallerDto } from '../orden-trabajo/dto/create-orden-trabajo.dto';
import { VehiculoService } from '../vehiculo/vehiculo.service';
import { CreateVehiculoDto } from '../vehiculo/dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from '../vehiculo/dto/update-vehiculo.dto';
import type { IQaService } from './interfaces/qa.interface';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';

@Injectable()
export class TallerService {
  constructor(
    private readonly ordenTrabajoService: OrdenTrabajoService,
    // Inyectamos los servicios de los módulos importados
    private readonly vehiculoService: VehiculoService,
    @Inject('IQaService') private readonly qaService: IQaService,
  ) {}

  // Crear una orden de trabajo desde el taller
  async crearOrdenTrabajo(createOrdenTrabajoTallerDto: CreateOrdenTrabajoTallerDto) {
    // El TallerService orquesta la llamada, delegando la creación al servicio especializado.
    return this.ordenTrabajoService.create(createOrdenTrabajoTallerDto);
  }

  // Cerrar una orden de trabajo desde el taller
  async cerrarOrdenTrabajo(otId: number, checklist: string, resultado: string) {
    // Delegamos toda la lógica al servicio especializado, que ya maneja la transacción.
    return this.ordenTrabajoService.cerrarOT(otId, checklist, resultado);
  }

  // Obtener todas las órdenes de trabajo
  async findAllWorkOrders(paginationQuery: PaginationQueryDto) {
    return this.ordenTrabajoService.findAll(paginationQuery);
  }

  // Actualizar el estado de una orden de trabajo
  async updateWorkOrderStatus(id: number, estado: OrdenTrabajoEstado) {
    return this.ordenTrabajoService.updateStatus(id, estado);
  }

  // Crear un vehículo desde el taller
  async crearVehiculo(createVehiculoDto: CreateVehiculoDto) {
    console.log('Orquestando la creación de un vehículo desde TallerService');
    return this.vehiculoService.create(createVehiculoDto);
  }

  // Actualizar un vehículo desde el taller
  async updateVehiculo(id: number, updateVehiculoDto: UpdateVehiculoDto) {
    console.log(`Orquestando la actualización del vehículo ${id} desde TallerService`);
    return this.vehiculoService.update(id, updateVehiculoDto);
  }

  // Obtener un vehículo por ID desde el taller
  async findOneVehiculo(patente: string) {
    return this.vehiculoService.findByPatente(patente);
  }
}
