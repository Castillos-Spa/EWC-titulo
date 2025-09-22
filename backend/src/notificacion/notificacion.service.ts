import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Role } from '@prisma/client';
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
    area?: string;
    role?: any;
    type: string;
  }) {
    const { title, message, createdById, userId, area, role, type } = data;
    const roleEnum =
      typeof role === 'string' && role in Role
        ? (Role as any)[role as keyof typeof Role]
        : (role as Role | undefined);

    const notification = await this.prisma.notification.create({
      data: {
        title,
        message,
        type,
        createdById,
        read: false,
        // Prisma model fields
        areas: area ? [area] : [],
        roles: roleEnum ? [roleEnum] : [],
        ...(userId
          ? {
              user: {
                connect: { id: userId },
              },
            }
          : {}),
      },
    });
    await this.gateway.sendNotification(notification);
    return notification;
  }

  async getNotificationsForUser(userId?: number, userRole?: string, userArea?: string) {
    const orFilters: any[] = [];
    if (typeof userId === 'number' && Number.isFinite(userId)) {
      orFilters.push({ userId });
    }
    if (userRole) {
      const roleEnum = (Role as any)[userRole as keyof typeof Role] ?? userRole;
      orFilters.push({ role: roleEnum });
    }
    if (userArea) {
      orFilters.push({ area: userArea });
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
