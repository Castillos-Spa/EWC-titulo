import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificacionService } from './notificacion.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Asegúrate que este sea el puerto de tu frontend
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class NotificacionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Mapea el ID del socket a la ID del usuario para saber quién es quién.
  private connectedUsers: Map<string, string> = new Map(); // Map<socketId, userId>

  constructor(
    private readonly notificacionService: NotificacionService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket, ...args: any[]) {
    // El frontend debe proveer el token en la propiedad `auth` de la conexión.
    const token = client.handshake.auth.token;
    if (!token) {
      console.log(`Cliente ${client.id} conectado sin token. Desconectando.`);
      return client.disconnect();
    }

    try {
      const payload = this.jwtService.verify(token);
      const userId = payload.sub.toString(); // 'sub' es el ID de usuario en el token
      const user = await this.usersService.findById(parseInt(userId, 10));

      if (!user || !user.active) {
        throw new Error('Usuario no válido o inactivo');
      }

      this.connectedUsers.set(client.id, userId);
      console.log(`Cliente conectado y autenticado: ${client.id}, Usuario ID: ${userId}`);
      this.server.emit('user-online', { userId });
    } catch (error) {
      console.log(`Token inválido para cliente ${client.id}. Desconectando.`, error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.connectedUsers.delete(client.id);
      console.log(`Cliente desconectado: ${client.id}, Usuario ID: ${userId}`);
      // Notifica a todos los usuarios que este usuario se desconectó.
      this.server.emit('user-offline', { userId });
    } else {
      console.log(`Cliente desconectado: ${client.id}`);
    }
  }

  /**
   * Envía una notificación a todos los clientes conectados.
   * Puede ser llamado desde otros servicios (ej. para notificar una nueva tarea).
   */
  sendGlobalNotification(type: string, payload: any) {
    this.server.emit('notification', { type, payload });
    console.log(`Enviando notificación global: ${type}`, payload);
  }
}
