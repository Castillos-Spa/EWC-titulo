import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrdenTrabajoTallerDto } from './dto/create-orden-trabajo.dto';
import { UpdateOrdenTrabajoDto } from './dto/update-orden-trabajo.dto';
import { PrismaService } from 'prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter'; // Import Prisma from the @prisma/client package
import { Prisma as PrismaClient } from '@prisma/client';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';

export enum OrdenTrabajoEstado {
  ABIERTA = 'abierta',
  PENDIENTE_REVISION = 'pendiente_revision',
  CERRADA = 'Cerrada',
  // ... otros estados
}

@Injectable()
export class OrdenTrabajoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private readonly ordenTrabajoInclude = {
    vehiculo: true, // Include related vehicle data
    qa: true, // Include related QA data
  } satisfies PrismaClient.OrdenTrabajoInclude;

  async create(createOrdenTrabajoDto: CreateOrdenTrabajoTallerDto) {
    const { vehiculoId, ...restOfDto } = createOrdenTrabajoDto;

    // Usamos una transacción para asegurar que ambas operaciones (crear OT y actualizar vehículo) se completen con éxito.
    return this.prisma.$transaction(async prisma => {
      const newOrdenTrabajo = await prisma.ordenTrabajo.create({
        data: {
          ...restOfDto,
          vehiculo: { connect: { id: vehiculoId } },
          // Aseguramos que las fechas se guarden como objetos Date si vienen como string
          scheduledDate: restOfDto.scheduledDate ? new Date(restOfDto.scheduledDate) : undefined,
          nextServiceDate: restOfDto.nextServiceDate ? new Date(restOfDto.nextServiceDate) : undefined,
          estado: OrdenTrabajoEstado.ABIERTA,
        },
      });

      // Actualizamos la fecha del último mantenimiento en el vehículo.
      await prisma.vehiculo.update({
        where: { id: vehiculoId },
        data: { lastMaintenanceDate: new Date() }, // Usamos la fecha actual como la del último mantenimiento.
      });

      this.eventEmitter.emit('ot.created', newOrdenTrabajo);

      return newOrdenTrabajo;
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
        include: this.ordenTrabajoInclude,
      }),
      this.prisma.ordenTrabajo.count(),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return { items, total, page, pageSize, totalPages };
  }

  async findOne(id: number) {
    const ordenTrabajo = await this.findOrdenTrabajoById(id);
    if (!ordenTrabajo) {
      throw new NotFoundException(`Orden de trabajo con ID ${id} no encontrada`);
    }
    return ordenTrabajo;
  }

  async updateStatus(id: number, estado: OrdenTrabajoEstado) {
    const updatedOrdenTrabajo = await this.prisma.ordenTrabajo.update({
      where: { id },
      data: { estado },
      include: { vehiculo: true },
    });

    // Si el nuevo estado es 'pendiente_revision', emitimos un evento.
    if (estado === OrdenTrabajoEstado.PENDIENTE_REVISION && updatedOrdenTrabajo) {
      this.eventEmitter.emit('orden_trabajo.pendiente_revision', updatedOrdenTrabajo);
    }

    return updatedOrdenTrabajo;
  }

  async update(id: number, updateOrdenTrabajoDto: UpdateOrdenTrabajoDto) {
    // Reutilizamos nuestro método privado para centralizar la lógica de actualización
    return this.updateOrdenTrabajo(id, updateOrdenTrabajoDto);
  }

  // Planificar tareas para la orden de trabajo
  async planificarTareas(id: number, tareas: string[]) {
    return this.updateOrdenTrabajo(id, { tareas });
  }

  // Asignar un responsable a la orden de trabajo
  async asignarResponsable(id: number, responsableId: number) {
    return this.updateOrdenTrabajo(id, { responsableId });
  }

  // Método privado genérico para actualizaciones
  private async updateOrdenTrabajo(id: number, data: PrismaClient.OrdenTrabajoUpdateInput) {
    // Primero, nos aseguramos de que la OT exista usando el método que ya tenemos.
    // Esto lanzará un NotFoundException si no se encuentra, manteniendo la consistencia.
    await this.findOne(id);

    const updatedOT = await this.prisma.ordenTrabajo.update({ where: { id }, data });
    this.eventEmitter.emit('ot.updated', updatedOT);
    return updatedOT;
  }

  // Cerrar una orden de trabajo y crear un registro en QA
  async cerrarOT(id: number, checklist: string, resultado: string) {
    return this.prisma.$transaction(async prisma => {
      // Verificar si la orden de OT existe
      const ordenTrabajo = await prisma.ordenTrabajo.findUnique({ where: { id } });
      if (!ordenTrabajo) {
        throw new NotFoundException(`Orden de trabajo con ID ${id} no encontrada`);
      }

      // Actualizar el estado de la OT a "Cerrada"
      await prisma.ordenTrabajo.update({
        where: { id },
        data: { estado: OrdenTrabajoEstado.CERRADA },
      });

      // Crear un registro en la tabla de QA
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

  private async findOrdenTrabajoById(id: number) {
    return this.prisma.ordenTrabajo.findUnique({
      where: { id },
      include: this.ordenTrabajoInclude,
    });
  }
}
