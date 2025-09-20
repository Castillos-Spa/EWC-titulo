import { Module } from '@nestjs/common';
import { NotificacionService } from './notificacion.service';
import { NotificacionGateway } from './notificacion.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    AuthModule, // Para proveer JwtService
    UsersModule, // Para proveer UsersService
  ],
  providers: [NotificacionGateway, NotificacionService],
  exports: [NotificacionGateway], // Opcional pero buena práctica si otros servicios necesitan enviar notificaciones
})
export class NotificacionModule {}
