// notificacion.gateway.ts
import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { NotificacionService } from './notificacion.service';

@WebSocketGateway({ cors: true })
export class NotificacionGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(
    @Inject(forwardRef(() => NotificacionService))
    private readonly notiService: NotificacionService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const userIdRaw = client.handshake.query.userId as string | undefined;
      const roleRaw = client.handshake.query.role as string | undefined;
      const areaRaw = client.handshake.query.area as string | undefined;

      const userId = userIdRaw ? Number(userIdRaw) : undefined;
      const role = roleRaw && roleRaw !== 'undefined' ? roleRaw : undefined;
      const area = areaRaw && areaRaw !== 'undefined' ? areaRaw : undefined;

      if (Number.isFinite(userId)) client.join(`user_${userId}`);
      if (role) client.join(`role_${role}`);
      if (area) client.join(`area_${area}`);

      if (userId || role || area) {
        const notifications = await this.notiService.getNotificationsForUser(userId, role, area);
        client.emit('notifications:init', notifications);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown_error';
      client.emit('notifications:error', { message });
      client.emit('notifications:init', []);
      return;
    }
  }

  async sendNotification(notification: any) {
    const payload = {
      id: notification.id,
      type: notification.type,
      message: notification.message,
      createdAt: notification.createdAt,
    };

    if (Array.isArray(notification.user) && notification.user.length) {
      notification.user.forEach((u: { id: number }) => {
        this.server.to(`user_${u.id}`).emit('notification', payload);
      });
    }

    if (Array.isArray(notification.roles) && notification.roles.length) {
      notification.roles.forEach((role: string) => {
        this.server.to(`role_${role}`).emit('notification', payload);
      });
    }

    if (Array.isArray(notification.areas) && notification.areas.length) {
      notification.areas.forEach((area: string) => {
        this.server.to(`area_${area}`).emit('notification', payload);
      });
    }
  }
}
