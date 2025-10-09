import { Inject, Injectable } from '@nestjs/common';
import { OrdenTrabajoService } from '../orden-trabajo/orden-trabajo.service';
import { CreateOrdenTrabajoTallerDto } from '../orden-trabajo/dto/create-orden-trabajo.dto';
import { VehiculoService } from '../vehiculo/vehiculo.service';
import { CreateVehiculoDto } from '../vehiculo/dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from '../vehiculo/dto/update-vehiculo.dto';
import type { IQaService } from './interfaces/qa.interface';

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
    // Verificar si la orden de trabajo existe
    const ordenTrabajo = await this.ordenTrabajoService.findOne(otId);
    if (!ordenTrabajo) {
      throw new Error(`Orden de trabajo con ID ${otId} no encontrada`);
    }

    // Actualizar el estado de la OT a "Cerrada"
    await this.ordenTrabajoService.update(otId, { estado: 'Cerrada' });

    // Crear el registro en QA
    return this.qaService.create({
      otId: otId,
      checklist: checklist,
      resultado: resultado,
    });
  }

  // Obtener todas las órdenes de trabajo
  async findAllWorkOrders() {
    return this.ordenTrabajoService.findAll();
  }

  // Actualizar el estado de una orden de trabajo
  async updateWorkOrderStatus(id: number, estado: string) {
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

  // --- Ejemplo de Orquestación ---

  // Este método usa VehiculoService para obtener los vehículos.
  // El controlador de Taller puede exponer esto en un endpoint si es necesario.
  async obtenerTodosLosVehiculos() {
    // Aquí puedes añadir lógica extra, como filtrar por estado, etc.
    console.log('Orquestando la obtención de vehículos desde TallerService');
    return this.vehiculoService.findAll({ take: 200, orderBy: { id: 'desc' } }); // Aumentamos el límite para el taller
  }
}
