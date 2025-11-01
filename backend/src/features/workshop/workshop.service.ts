import { Inject, Injectable } from '@nestjs/common';
import { WorkOrderService, WorkOrderStatus } from '../work-order/work-order.service';
import { CreateWorkOrderDto } from '../work-order/dto/create-work-order.dto';
import { VehicleService } from '../vehicle/vehicle.service';
import { CreateVehicleDto } from '../vehicle/dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../vehicle/dto/update-vehicle.dto';
import type { IQaService } from './interfaces/qa.interface';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';

@Injectable()
export class WorkshopService {
  constructor(
    private readonly workOrderService: WorkOrderService,
    private readonly vehicleService: VehicleService,
    @Inject('IQaService') private readonly qaService: IQaService,
  ) {}

  async createWorkOrder(createWorkOrderDto: CreateWorkOrderDto) {
    return this.workOrderService.create(createWorkOrderDto);
  }

  async closeWorkOrder(workOrderId: number, checklist: string, result: string) {
    return this.workOrderService.cerrarOT(workOrderId, checklist, result);
  }

  async findAllWorkOrders(paginationQuery: PaginationQueryDto) {
    return this.workOrderService.findAll(paginationQuery);
  }

  async updateWorkOrderStatus(id: number, status: WorkOrderStatus) {
    return this.workOrderService.updateStatus(id, status);
  }

  async createVehicle(createVehicleDto: CreateVehicleDto) {
    return this.vehicleService.create(createVehicleDto);
  }

  async updateVehicle(id: number, updateVehicleDto: UpdateVehicleDto) {
    return this.vehicleService.update(id, updateVehicleDto);
  }

  async findVehicleByPlate(plate: string) {
    return this.vehicleService.findByPlate(plate);
  }
}
