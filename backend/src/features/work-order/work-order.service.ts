import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { PrismaService } from 'prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter'; // Import Prisma from the @prisma/client package
import { Prisma as PrismaClient } from '@prisma/client';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';

export enum WorkOrderStatus {
  OPEN = 'abierta',
  UNDER_REVIEW = 'pendiente_revision',
  CLOSED = 'Cerrada',
  // ... additional statuses
}

@Injectable()
export class WorkOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private readonly workOrderInclude = {
    vehiculo: true, // Include related vehicle data
    qa: true, // Include related QA data
  } satisfies PrismaClient.OrdenTrabajoInclude;

  async create(createWorkOrderDto: CreateWorkOrderDto) {
    const { vehiculoId, ...restOfDto } = createWorkOrderDto;

    // Use a transaction to ensure both creating the work order and updating the vehicle succeed together.
    return this.prisma.$transaction(async prisma => {
      const newWorkOrder = await prisma.ordenTrabajo.create({
        data: {
          ...restOfDto,
          vehiculo: { connect: { id: vehiculoId } },
          // Persist dates as Date instances when provided as strings.
          scheduledDate: restOfDto.scheduledDate ? new Date(restOfDto.scheduledDate) : undefined,
          nextServiceDate: restOfDto.nextServiceDate ? new Date(restOfDto.nextServiceDate) : undefined,
          estado: WorkOrderStatus.OPEN,
        },
      });

      await prisma.vehiculo.update({
        where: { id: vehiculoId },
        data: { lastMaintenanceDate: new Date() },
      });

      this.eventEmitter.emit('ot.created', newWorkOrder);

      return newWorkOrder;
    });
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const { page = 1, pageSize = 20 } = paginationQuery;
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.ordenTrabajo.findMany({
        skip,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: this.workOrderInclude,
      }),
      this.prisma.ordenTrabajo.count(),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return { items, total, page, pageSize, totalPages };
  }

  async findOne(id: number) {
    const workOrder = await this.findWorkOrderById(id);
    if (!workOrder) {
      throw new NotFoundException(`Work order with ID ${id} not found`);
    }
    return workOrder;
  }

  async updateStatus(id: number, status: WorkOrderStatus) {
    const updatedWorkOrder = await this.prisma.ordenTrabajo.update({
      where: { id },
      data: { estado: status },
      include: { vehiculo: true },
    });

    if (status === WorkOrderStatus.UNDER_REVIEW && updatedWorkOrder) {
      this.eventEmitter.emit('orden_trabajo.pendiente_revision', updatedWorkOrder);
    }

    return updatedWorkOrder;
  }

  async update(id: number, updateWorkOrderDto: UpdateWorkOrderDto) {
    return this.updateWorkOrder(id, updateWorkOrderDto);
  }

  // Schedule tasks for a work order
  async planificarTareas(id: number, tareas: string[]) {
    return this.updateWorkOrder(id, { tareas });
  }

  // Assign a responsible technician to the work order
  async asignarResponsable(id: number, responsableId: number) {
    return this.updateWorkOrder(id, { responsableId });
  }

  private async updateWorkOrder(id: number, data: PrismaClient.OrdenTrabajoUpdateInput) {
    await this.findOne(id);

    const updatedWorkOrder = await this.prisma.ordenTrabajo.update({ where: { id }, data });
    this.eventEmitter.emit('ot.updated', updatedWorkOrder);
    return updatedWorkOrder;
  }

  // Cerrar una orden de trabajo y crear un registro en QA
  async cerrarOT(id: number, checklist: string, resultado: string) {
    return this.prisma.$transaction(async prisma => {
      const workOrder = await prisma.ordenTrabajo.findUnique({ where: { id } });
      if (!workOrder) {
        throw new NotFoundException(`Work order with ID ${id} not found`);
      }

      await prisma.ordenTrabajo.update({
        where: { id },
        data: { estado: WorkOrderStatus.CLOSED },
      });

      return prisma.qA.create({
        data: {
          otId: id,
          checklist: checklist,
          resultado: resultado,
        },
      });
    });
  }

  async remove(id: number) {
    // Asegurarse que la OT existe antes de borrar
    await this.findOne(id);
    return this.prisma.ordenTrabajo.delete({
      where: { id },
    });
  }

  private async findWorkOrderById(id: number) {
    return this.prisma.ordenTrabajo.findUnique({
      where: { id },
      include: this.workOrderInclude,
    });
  }
}
