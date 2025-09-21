// notificacion.gateway.ts
import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificacionService } from './notificacion.service';

@WebSocketGateway({ cors: true })
export class NotificacionGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(private readonly notiService: NotificacionService) {}

  async handleConnection(client: Socket) {
    // ⚡ Se asume que el cliente manda su userId, role y area en query params
    const userId = parseInt(client.handshake.query.userId as string);
    const role = client.handshake.query.role as string;
    const area = client.handshake.query.area as string;

    client.join(`user_${userId}`);
    client.join(`role_${role}`);
    client.join(`area_${area}`);

    // Enviar notificaciones guardadas en BD (últimas 5)
    const notifications = await this.notiService.getNotificationsForUser(userId, role, area);
    client.emit('notifications:init', notifications);
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
