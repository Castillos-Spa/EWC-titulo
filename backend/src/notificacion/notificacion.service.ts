import { Injectable, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Role } from '@prisma/client';
import { NotificacionGateway } from './notificacion.gateway';
import { UpdateNotificationDto } from './dto/update-notification.dto';

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

  async findAllForUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roleAssignments: true },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const userRoles = user.roleAssignments.map(ra => ra.role);
    const userAreas = user.roleAssignments.map(ra => ra.area).filter(Boolean);

    return this.prisma.notification.findMany({
      where: {
        OR: [
          { user: { some: { id: userId } } }, // Notificaciones directas
          { areas: { hasSome: userAreas } }, // Notificaciones por área
          { roles: { hasSome: userRoles } }, // Notificaciones por rol
          { areas: { isEmpty: true }, roles: { isEmpty: true }, user: { none: {} } }, // Globales
        ],
      },
      include: {
        createdBy: { select: { username: true } },
        readBy: { where: { userId: userId } }, // Trae el estado de lectura SOLO para el usuario actual
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
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
}
