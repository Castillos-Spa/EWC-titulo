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
    if (notification.userId) {
      this.server.to(`user_${notification.userId}`).emit('notification', notification);
    }
    if (notification.role) {
      this.server.to(`role_${notification.role}`).emit('notification', notification);
    }
    if (notification.area) {
      this.server.to(`area_${notification.area}`).emit('notification', notification);
    }
  }
}
