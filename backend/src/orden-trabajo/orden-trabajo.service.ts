import { Injectable } from '@nestjs/common';
import { CreateOrdenTrabajoTallerDto } from './dto/create-orden-trabajo.dto';
import { UpdateOrdenTrabajoDto } from './dto/update-orden-trabajo.dto';
import { PrismaService } from 'prisma/prisma.service';
import { TicketService } from '../ticket/ticket.service';
import { Role, TicketCategory } from '@prisma/client';

@Injectable()
export class OrdenTrabajoService {
  constructor(
    private readonly prisma: PrismaService,
    // Inyectamos el TicketService para poder crear tickets
    private readonly ticketService: TicketService,
  ) {}

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
          estado: 'abierta',
        },
      });

      // Actualizamos la fecha del último mantenimiento en el vehículo.
      await prisma.vehiculo.update({
        where: { id: vehiculoId },
        data: { lastMaintenanceDate: new Date() }, // Usamos la fecha actual como la del último mantenimiento.
      });

      return newOrdenTrabajo;
    });
  }

  async findAll() {
    return this.prisma.ordenTrabajo.findMany({
      include: { vehiculo: true, qa: true },
    });
  }

  async findOne(id: number) {
    return this.prisma.ordenTrabajo.findUnique({
      where: { id },
      include: { vehiculo: true, qa: true },
    });
  }

  async updateStatus(id: number, estado: string) {
    const updatedOrdenTrabajo = await this.prisma.ordenTrabajo.update({
      where: { id },
      data: { estado },
      include: { vehiculo: true },
    });

    // Si el nuevo estado es 'pendiente_revision', creamos el ticket para el supervisor.
    if (estado === 'pendiente_revision' && updatedOrdenTrabajo) {
      // El ticket es "creado" por el mecánico que finalizó el trabajo.
      // El sistema lo enrutará a los Supervisores de Transporte.
      const otCreatorId = updatedOrdenTrabajo.responsableId;

      if (otCreatorId) {
        await this.ticketService.create(
          {
            title: `Revisión de Mantenimiento OT-${updatedOrdenTrabajo.id}`,
            description: `Se requiere revisión para la OT #${updatedOrdenTrabajo.id} en el vehículo ${updatedOrdenTrabajo.vehiculo.patente}. Descripción: ${updatedOrdenTrabajo.description}`,
            category: TicketCategory.Mantenimiento,
            // Asignamos al área de Transporte y rol de Supervisor
            recipientArea: ['Transporte'],
            recipientRole: [Role.Supervisor],
            ordenTrabajoId: updatedOrdenTrabajo.id, // ¡Aquí está la conexión!
          },
          otCreatorId, // El ticket es "creado" por el sistema/mecánico.
        );
      }
    }

    // Lógica para cuando el supervisor aprueba el ticket (esto se manejaría en el TicketService)
    // Por ejemplo, en TicketService.update, si un ticket de mantenimiento se cierra/aprueba:
    // 1. Buscar la OT asociada al ticket.
    // 2. Llamar a `this.ordenTrabajoService.updateStatus(otId, 'completado')`.
    // 3. Cambiar el estado del vehículo a 'disponible'.

    return updatedOrdenTrabajo;
  }

  async update(id: number, updateOrdenTrabajoDto: UpdateOrdenTrabajoDto) {
    return this.prisma.ordenTrabajo.update({
      where: { id },
      data: updateOrdenTrabajoDto,
    });
  }

  // Planificar tareas para la orden de trabajo
  async planificarTareas(id: number, tareas: string[]) {
    return this.prisma.ordenTrabajo.update({
      where: { id },
      data: { tareas },
    });
  }

  // Asignar un responsable a la orden de trabajo
  async asignarResponsable(id: number, responsableId: number) {
    return this.prisma.ordenTrabajo.update({
      where: { id },
      data: { responsableId },
    });
  }

  // Cerrar una orden de trabajo y crear un registro en QA
  async cerrarOT(id: number, checklist: string, resultado: string) {
    // Verificar si la orden de OT existe
    const ordenTrabajo = await this.prisma.ordenTrabajo.findUnique({ where: { id } });
    if (!ordenTrabajo) {
      throw new Error(`Orden de trabajo con ID ${id} no encontrada`);
    } // Actualizar el estado de la OT a "Cerrada"

    await this.prisma.ordenTrabajo.update({
      where: { id },
      data: { estado: 'Cerrada' },
    }); // Crear un registro en la tabla de QA

    return this.prisma.qA.create({
      data: {
        otId: id,
        checklist: checklist,
        resultado: resultado,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.ordenTrabajo.delete({
      where: { id },
    });
  }
}
