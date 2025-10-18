import { Injectable, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Role, Ticket } from '@prisma/client';
import { NotificacionGateway } from './notificacion.gateway';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';

@Injectable()
export class NotificacionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificacionGateway))
    private readonly gateway: NotificacionGateway,
  ) {}

  async createNotification(data: {
    title: string;
    message: string;
    createdById: number;
    userId?: number;
    areas?: string[];
    roles?: Role[]; // Changed to Role[]
    type: string;
  }) {
    const { title, message, createdById, userId, areas, roles, type } = data; // roles is now Role[]

    const created = await this.prisma.notification.create({
      data: {
        title,
        message,
        type,
        createdBy: {
          connect: { id: createdById },
        },
        areas: areas ?? [], // Use directly, default to empty array
        roles: roles ?? [], // Use directly, default to empty array
        ...(userId
          ? {
              user: {
                connect: { id: userId },
              },
            }
          : {}),
      },
    });

    // Recargar con relación de usuarios para emitir a sus salas
    const notification = await this.prisma.notification.findUnique({
      where: { id: created.id },
      include: { user: { select: { id: true } } },
    });

    if (notification) {
      // Check if notification exists before sending
      await this.gateway.sendNotification(notification);
    }
    return notification;
  }

  async createCustomNotification(dto: any, createdById: number) {
    const { target, ...rest } = dto;
    const data: any = {
      ...rest,
      type: 'custom',
      createdBy: { connect: { id: createdById } },
    };

    if (target?.scope === 'areas' && target.areas.length > 0) {
      data.areas = target.areas;
    } else {
      // Aseguramos que para notificaciones globales, los arrays estén vacíos.
      data.areas = [];
      data.roles = [];
    }

    const createdNotification = await this.prisma.notification.create({
      data,
      include: {
        createdBy: { select: { username: true } },
      },
    });

    await this.gateway.sendNotification(createdNotification);
    return createdNotification;
  }

  async findAllForUser(userId: number, paginationQuery: PaginationQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roleAssignments: true },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const userRoles = user.roleAssignments.map(ra => ra.role);
    const userAreas = user.roleAssignments.map(ra => ra.area).filter(Boolean);

    const whereClause = {
      where: {
        OR: [
          { user: { some: { id: userId } } }, // Notificaciones directas
          { areas: { hasSome: userAreas } }, // Notificaciones por área
          { roles: { hasSome: userRoles } }, // Notificaciones por rol
          { areas: { isEmpty: true }, roles: { isEmpty: true }, user: { none: {} } }, // Globales
        ],
      },
    };

    const { page = 1, pageSize = 20 } = paginationQuery;
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        ...whereClause,
        skip,
        take: pageSize,
        include: {
          createdBy: { select: { username: true } },
          readBy: { where: { userId: userId } }, // Trae el estado de lectura SOLO para el usuario actual
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count(whereClause),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    return { items, total, page, pageSize, totalPages };
  }

  async update(id: number, updateNotificationDto: UpdateNotificationDto) {
    return this.prisma.notification.update({ where: { id }, data: updateNotificationDto });
  }

  async markAsRead(notificationId: number, userId: number) {
    await this.prisma.userNotification.upsert({
      where: { userId_notificationId: { userId, notificationId } },
      update: { read: true },
      create: { userId, notificationId, read: true },
    });
    // Devolvemos la notificación actualizada para el usuario
    return this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        createdBy: { select: { username: true } },
        readBy: { where: { userId: userId } },
      },
    });
  }

  async getUserRolesAndAreas(userId: number): Promise<{ roles: Role[]; areas: string[] } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roleAssignments: true },
    });

    if (!user) return null;

    const roles = user.roleAssignments.map(ra => ra.role);
    const areas = user.roleAssignments.map(ra => ra.area).filter(Boolean);

    return { roles: [...new Set(roles)], areas: [...new Set(areas)] };
  }

  // --- Event Listeners for Tickets ---

  @OnEvent('ticket.created')
  async handleTicketCreatedEvent(payload: {
    ticket: Ticket;
    areasToNotify: Set<string>;
    recipientRole: Role[];
    createdById: number;
  }) {
    const { ticket, areasToNotify, recipientRole, createdById } = payload;
    await this.createNotification({
      title: 'Nuevo Ticket Creado',
      message: `Se ha creado un nuevo ticket: "${ticket.title}"`,
      type: 'ticket',
      createdById: createdById,
      areas: Array.from(areasToNotify),
      roles: recipientRole,
    });
  }

  @OnEvent('ticket.assigned')
  async handleTicketAssignedEvent(payload: { ticket: Ticket; assignedToId: number; createdById: number }) {
    await this.createNotification({
      title: 'Ticket Asignado',
      message: `Se te ha asignado el ticket: "${payload.ticket.title}".`,
      type: 'ticket',
      createdById: payload.createdById,
      userId: payload.assignedToId,
    });
  }

  @OnEvent('ticket.statusChanged')
  async handleTicketStatusChangedEvent(payload: { ticket: Ticket; newStatus: string; updatedById: number }) {
    // Notificar al creador del ticket sobre el cambio de estado
    await this.createNotification({
      title: 'Estado de Ticket Actualizado',
      message: `El estado del ticket "${payload.ticket.title}" ha cambiado a ${payload.newStatus}.`,
      type: 'ticket_status_changed',
      createdById: payload.updatedById,
      userId: payload.ticket.createdById,
    });
  }

  @OnEvent('approval.required')
  async handleApprovalRequiredEvent(payload: {
    ticket: Ticket;
    step: { approverArea: string; approverRole: Role };
    createdById: number;
  }) {
    await this.createNotification({
      title: 'Aprobación Requerida',
      message: `La solicitud "${payload.ticket.title}" requiere tu aprobación.`,
      type: 'ticket',
      createdById: payload.createdById,
      areas: [payload.step.approverArea],
      roles: [payload.step.approverRole],
    });
  }

  @OnEvent('approval.rejected')
  async handleApprovalRejectedEvent(payload: { ticket: Ticket; approverId: number }) {
    await this.createNotification({
      title: 'Solicitud Rechazada',
      message: `Tu solicitud de suministro "${payload.ticket.title}" ha sido rechazada.`,
      type: 'ticket',
      createdById: payload.approverId,
      userId: payload.ticket.createdById,
    });
  }

  @OnEvent('approval.completed')
  async handleApprovalCompletedEvent(payload: { ticket: Ticket; approverId: number }) {
    await this.createNotification({
      title: 'Solicitud Aprobada',
      message: `Tu solicitud de suministro "${payload.ticket.title}" ha sido completamente aprobada.`,
      type: 'ticket',
      createdById: payload.approverId,
      userId: payload.ticket.createdById,
    });
  }

  @OnEvent('approval.inProgress')
  async handleApprovalInProgressEvent(payload: { ticket: Ticket; approverId: number }) {
    await this.createNotification({
      title: 'Solicitud en Progreso',
      message: `Tu solicitud "${payload.ticket.title}" ha pasado la primera aprobación y está en progreso.`,
      type: 'ticket',
      createdById: payload.approverId,
      userId: payload.ticket.createdById,
    });
  }
}
