import { Injectable, NotFoundException } from '@nestjs/common';
import { Role, Ticket, TicketCategory, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificacionService } from '../notificacion/notificacion.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificacionService,
  ) {}

  async create(createTicketDto: CreateTicketDto, createdById: number): Promise<Ticket> {
    const { recipientArea, tags, category, ...restOfDto } = createTicketDto;

    // Convertir la categoría de string a enum
    const categoryEnum = category.replace(/ /g, '_') as TicketCategory;

    const ticket = await this.prisma.ticket.create({
      data: {
        ...restOfDto,
        category: categoryEnum,
        recipientArea: Array.isArray(recipientArea) ? recipientArea : recipientArea ? [recipientArea] : [],
        tags: tags ?? [],
        createdById,
      },
    });

    // Notificación al área de destino y al área del creador.
    const creator = await this.prisma.user.findUnique({
      where: { id: createdById },
      include: { roleAssignments: { where: { isActive: true } } },
    });

    const creatorAreas = creator?.roleAssignments.map(ra => ra.area) || [];
    const recipientAreasArray = Array.isArray(recipientArea) ? recipientArea : recipientArea ? [recipientArea] : [];

    // Usamos un Set para evitar duplicados si el creador pertenece al área de destino.
    const areasToNotify = new Set<string>([...creatorAreas, ...recipientAreasArray]);

    if (areasToNotify.size > 0) {
      await this.notificationService.createNotification({
        title: 'Nuevo Ticket Creado',
        message: `Se ha creado un nuevo ticket: "${ticket.title}" para el área de ${recipientAreasArray.join(', ')}.`,
        type: 'ticket_created',
        createdById: createdById,
        role: Array.from(areasToNotify), // Usamos 'role' para que coincida con el DTO de notificación
      });
    }

    // Notificación si se asigna a alguien directamente.
    if (createTicketDto.assignedToId) {
      await this.notificationService.createNotification({
        title: 'Ticket Asignado',
        message: `Se te ha asignado el ticket: "${ticket.title}".`,
        type: 'ticket_assigned',
        createdById: createdById,
        userId: createTicketDto.assignedToId,
      });
    }

    return ticket;
  }

  findAll() {
    return this.prisma.ticket.findMany({
      include: {
        createdBy: {
          select: { id: true, username: true, email: true },
        },
        assignedTo: {
          select: { id: true, username: true, email: true },
        },
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, username: true, email: true },
        },
        assignedTo: {
          select: { id: true, username: true, email: true },
        },
      },
    });
  }

  async update(id: number, updateTicketDto: UpdateTicketDto, updatedById: number) {
    const ticketBeforeUpdate = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticketBeforeUpdate) {
      throw new NotFoundException(`Ticket con ID #${id} no encontrado`);
    }

    // Desestructuramos 'status' junto con las otras propiedades
    const {
      recipientArea,
      assignedToId,
      category,
      status,
      assignedUserConfirmation,
      requestingUserConfirmation,
      ...restOfUpdateDto
    } = updateTicketDto;

    const dataToUpdate: any = {
      ...restOfUpdateDto,
    };

    if (assignedToId !== undefined) dataToUpdate.assignedToId = assignedToId;

    if (category) {
      dataToUpdate.category = category.replace(/ /g, '_') as TicketCategory;
    }

    // Lógica de confirmación y cambio de estado automático
    if (assignedUserConfirmation === true) {
      dataToUpdate.assignedUserConfirmation = true;
      dataToUpdate.status = TicketStatus.Resuelto; // 1er check -> Resuelto
    } else if (assignedUserConfirmation === false) {
      // Si se desmarca la primera confirmación, se reabre y se resetea la segunda.
      dataToUpdate.assignedUserConfirmation = false;
      dataToUpdate.requestingUserConfirmation = false;
      dataToUpdate.status = TicketStatus.EnProgreso;
    } else if (requestingUserConfirmation === true) {
      if (ticketBeforeUpdate.assignedUserConfirmation) {
        dataToUpdate.requestingUserConfirmation = true;
        dataToUpdate.status = TicketStatus.Cerrado; // 2do check -> Cerrado
      }
    } else if (status) {
      // Solo permite cambiar el estado manualmente si no hay una lógica de confirmación activa
      dataToUpdate.status = status;
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: dataToUpdate,
    });

    // Notificación por cambio de asignación
    if (updateTicketDto.assignedToId && updateTicketDto.assignedToId !== ticketBeforeUpdate.assignedToId) {
      await this.notificationService.createNotification({
        title: 'Ticket Asignado',
        message: `Se te ha asignado el ticket: "${updatedTicket.title}".`,
        type: 'ticket_assigned',
        createdById: updatedById,
        userId: updateTicketDto.assignedToId,
      });
    }

    // Volver a buscar el ticket actualizado con todas las relaciones para devolverlo al frontend
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, username: true, email: true },
        },
        assignedTo: {
          select: { id: true, username: true, email: true },
        },
        // Si tienes más relaciones que mostrar en el frontend, inclúyelas aquí
      },
    });
  }

  async remove(id: number) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket con ID #${id} no encontrado`);
    }
    return this.prisma.ticket.delete({ where: { id } });
  }
}
