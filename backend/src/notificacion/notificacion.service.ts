import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Role } from '@prisma/client';
import { NotificacionGateway } from './notificacion.gateway';

@Injectable()
export class NotificacionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificacionGateway,
  ) {}

  async createNotification(data: {
    title: string;
    message: string;
    createdById: number;
    userId?: number;
    area?: string;
    role?: Role;
    type: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: { ...data, read: false },
    });
    await this.gateway.sendNotification(notification);
    return notification;
  }

  async getNotificationsForUser(userId: number, userRole: string, userArea: string) {
    return this.prisma.notification.findMany({
      where: {
        OR: [
          { userId }, // notificaciones directas
          { role: userRole as Role }, // notificaciones por rol
          { area: userArea }, // notificaciones por área
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 5, // últimas 5
    });
  }

  async markAsRead(id: number) {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }
}
