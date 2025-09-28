import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Role, Notification as PrismaNotification } from '@prisma/client';
import { NotificacionGateway } from './notificacion.gateway';

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
        read: false,
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
      // Use PrismaNotification type
      where: { id: created.id },
      include: { user: { select: { id: true } } },
    });

    if (notification) {
      // Check if notification exists before sending
      await this.gateway.sendNotification(notification);
    }
    return notification;
  }

  async getNotificationsForUser(userId?: number, userRole?: string, userArea?: string) {
    const orFilters: any[] = [];
    if (typeof userId === 'number' && Number.isFinite(userId)) {
      orFilters.push({ user: { some: { id: userId } } }); // This connects to the User model
    }
    if (userRole) {
      const roleEnum = (Role as any)[userRole as keyof typeof Role] ?? userRole;
      orFilters.push({ roles: { has: roleEnum } });
    }
    if (userArea) {
      orFilters.push({ areas: { has: userArea } });
    }

    return this.prisma.notification.findMany({
      where: orFilters.length ? { OR: orFilters } : {},
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async markAsRead(id: number) {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }
}
