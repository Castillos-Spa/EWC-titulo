import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class NotificacionGateway {
  @WebSocketServer() server: Server;

  sendNotification(notification: any) {
    this.server.emit('notification', notification);
  }
}
