import { Inject, Injectable } from '@nestjs/common';
import { WorkOrderService, WorkOrderStatus } from '../work-order/work-order.service';
import { CreateWorkOrderDto } from '../work-order/dto/create-work-order.dto';
import { VehicleService } from '../vehicle/vehicle.service';
import { CreateVehicleDto } from '../vehicle/dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../vehicle/dto/update-vehicle.dto';
import type { IQaService } from './interfaces/qa.interface';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { UsersService } from '../users/users.service';
import { Specialty } from '@prisma/client';
import { WorkshopOverviewQueryDto } from './dto/workshop-overview-query.dto';

@Injectable()
export class WorkshopService {
  constructor(
    private readonly workOrderService: WorkOrderService,
    private readonly vehicleService: VehicleService,
    @Inject('IQaService') private readonly qaService: IQaService,
    private readonly usersService: UsersService,
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

  async getOverview(query: WorkshopOverviewQueryDto) {
    const include = new Set(
      query.include && query.include.length > 0 ? query.include : ['workOrders', 'vehicles', 'users'],
    );

    const workOrdersPage = query.workOrdersPage ?? 1;
    const workOrdersPageSize = query.workOrdersPageSize ?? 10;
    const vehiclesPage = query.vehiclesPage ?? 1;
    const vehiclesPageSize = query.vehiclesPageSize ?? 10;
    const usersPage = query.usersPage ?? 1;
    const usersPageSize = query.usersPageSize ?? 10;
    const mechanicsPageSize = query.mechanicsPageSize ?? usersPageSize;

    const overview: Record<string, unknown> = {};
    const jobs: Promise<void>[] = [];

    if (include.has('workOrders')) {
      jobs.push(
        this.workOrderService.findAll({ page: workOrdersPage, pageSize: workOrdersPageSize }).then(result => {
          overview.workOrders = result;
        }),
      );
    }

    if (include.has('vehicles')) {
      jobs.push(
        this.vehicleService.findAll({ page: vehiclesPage, pageSize: vehiclesPageSize }).then(result => {
          overview.vehicles = result;
        }),
      );
    }

    if (include.has('users')) {
      jobs.push(
        this.usersService.findAll({ page: usersPage, pageSize: usersPageSize }).then(result => {
          overview.users = result;
        }),
      );
    }

    if (include.has('mechanics')) {
      jobs.push(
        this.usersService
          .findAll({ page: 1, pageSize: mechanicsPageSize, specialty: Specialty.MECHANIC })
          .then(result => {
            overview.mechanics = result;
          }),
      );
    }

    await Promise.all(jobs);

    return overview;
  }
}
