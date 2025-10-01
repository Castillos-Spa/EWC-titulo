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
    console.log(`[Socket.io] Cliente conectado: ${client.id}`);
    try {
      const userIdRaw = client.handshake.query.userId as string | undefined;
      const userId = userIdRaw ? Number(userIdRaw) : undefined;

      if (userId && Number.isFinite(userId) && userId > 0) {
        client.join(`user_${userId}`);

        // Obtener roles y áreas del usuario desde el servicio para unirse a las salas correctas
        const user = await this.notiService.getUserRolesAndAreas(userId);
        if (user) {
          user.roles.forEach(role => client.join(`role_${role}`));
          user.areas.forEach(area => client.join(`area_${area}`));
        }

        // This check is now correctly placed.
        // It was inside the `if (user)` block before, which was also fine,
        // but this is slightly cleaner. The important part is that it's inside the userId check.
        const notifications = await this.notiService.findAllForUser(userId);
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

    const isTargeted =
      (Array.isArray(notification.user) && notification.user.length > 0) ||
      (Array.isArray(notification.roles) && notification.roles.length > 0) ||
      (Array.isArray(notification.areas) && notification.areas.length > 0);

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

    // Si no es para un usuario, rol o área específica, es global.
    if (!isTargeted) {
      this.server.emit('notification', payload); // Enviar a todos los clientes conectados.
    }
  }
}
