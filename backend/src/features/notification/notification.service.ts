import { Injectable, Inject, forwardRef, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Role, Area } from '@prisma/client';
import type { Ticket, OrdenTrabajo, CivilWork, Aseo } from '@prisma/client';
import { NotificationGateway } from './notification.gateway';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { TenantContextService } from '@/app/core/tenant-context.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationGateway))
    private readonly gateway: NotificationGateway,
    private readonly tenantContext: TenantContextService,
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
    const tenantId = this.resolveTenantId();

    const created = await this.prisma.notification.create({
      data: {
        title,
        message,
        type,
        createdBy: {
          connect: { id: createdById },
        },
        tenant: { connect: { id: tenantId } },
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
    const tenantId = this.resolveTenantId();
    const { target, ...rest } = dto;
    const data: any = {
      ...rest,
      type: 'custom',
      createdBy: { connect: { id: createdById } },
      tenant: { connect: { id: tenantId } },
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

    let whereClause: any = {};

    // Si el usuario no es Admin, aplicamos los filtros. Si es Admin, whereClause se queda vacío para traer
    if (!userRoles.includes(Role.Admin)) {
      whereClause = {
        where: {
          OR: [
            { user: { some: { id: userId } } }, // Notificaciones directas
            { areas: { hasSome: userAreas } }, // Notificaciones por área
            { roles: { hasSome: userRoles } }, // Notificaciones por rol
            { areas: { isEmpty: true }, roles: { isEmpty: true }, user: { none: {} } }, // Globales
          ],
        },
      };
    }

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
    const tenantId = this.resolveTenantId();
    await this.prisma.userNotification.upsert({
      where: { userId_notificationId: { userId, notificationId } },
      update: { read: true },
      create: { userId, notificationId, read: true, tenantId },
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
    const { ticket, newStatus, updatedById } = payload;

    // 1. Notificar a los supervisores del área del ticket sobre el cambio de estado.
    if (ticket.recipientArea && ticket.recipientArea.length > 0) {
      this.createNotification({
        title: 'Estado de Ticket Actualizado',
        message: `El estado del ticket "${ticket.title}" en tu área ha cambiado a ${newStatus}.`,
        type: 'ticket_status_changed',
        createdById: updatedById,
        areas: ticket.recipientArea,
        roles: [Role.Supervisor],
      });
    }

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

  // --- Event Listeners for Orden de Trabajo ---

  @OnEvent('ot.created')
  async handleOTCreated(payload: OrdenTrabajo) {
    await this.createNotification({
      title: 'Nueva Orden de Trabajo',
      message: `Se ha creado la OT #${payload.id}.`,
      type: 'ot_created',
      createdById: payload.responsableId || 1, // Fallback to system user if no responsable
      areas: ['Transporte'],
      roles: [Role.Supervisor],
    });
  }

  @OnEvent('ot.updated')
  async handleOTUpdated(payload: OrdenTrabajo) {
    await this.createNotification({
      title: 'Orden de Trabajo Actualizada',
      message: `La OT #${payload.id} ha sido actualizada.`,
      type: 'ot_updated',
      createdById: payload.responsableId || 1, // Fallback to system user if no responsable
      areas: ['Transporte'],
      roles: [Role.Supervisor],
    });
  }

  // NOTA: De manera similar, se pueden agregar listeners para 'ruta.created', 'ruta.updated',
  // 'vehiculo.created', y 'vehiculo.updated' una vez que esos eventos se emitan
  // desde sus respectivos servicios.

  // --- Event Listeners for Civil Works ---

  @OnEvent('civilwork.created')
  async handleCivilWorkCreated(payload: CivilWork) {
    await this.createNotification({
      title: 'Nueva Obra Civil Creada',
      message: `Se ha creado el proyecto de obra civil: "${payload.project}".`,
      type: 'civilwork_created',
      createdById: payload.createdById,
      areas: [Area.Obras],
      roles: [Role.Supervisor],
    });
  }

  @OnEvent('civilwork.updated')
  async handleCivilWorkUpdated(payload: CivilWork) {
    await this.createNotification({
      title: 'Obra Civil Actualizada',
      message: `El proyecto de obra civil "${payload.project}" ha sido actualizado.`,
      type: 'civilwork_updated',
      // Asumimos que el que actualiza es el responsable, si no, se necesita pasar el ID del actor.
      // Por ahora, usamos el ID del creador original como fallback.
      createdById: payload.createdById,
      areas: [Area.Obras],
      roles: [Role.Supervisor],
    });
  }

  // --- Event Listeners for Cleaning Reports ---

  @OnEvent('cleaning_report.created')
  async handleCleaningReportCreated(payload: { report: Aseo; createdById: number }) {
    const { report, createdById } = payload;
    await this.createNotification({
      title: 'Nuevo Reporte de Aseo',
      message: `Se ha creado un nuevo reporte de aseo para el área: "${report.area}".`,
      type: 'cleaning_report_created',
      createdById: createdById,
      areas: [Area.Aseo],
      roles: [Role.Supervisor],
    });
  }

  @OnEvent('cleaning_report.updated')
  async handleCleaningReportUpdated(payload: { report: Aseo; actorId: number }) {
    const { report, actorId } = payload;
    await this.createNotification({
      title: 'Reporte de Aseo Actualizado',
      message: `El reporte de aseo para "${report.area}" ha sido actualizado.`,
      type: 'cleaning_report_updated',
      createdById: actorId,
      areas: [Area.Aseo],
      roles: [Role.Supervisor],
    });
  }

  private resolveTenantId(): number {
    const tenantId = this.tenantContext.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant no especificado en la operación.');
    }
    return tenantId;
  }
}
