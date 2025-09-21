import { Module } from '@nestjs/common';
import { NotificacionService } from './notificacion.service';
import { NotificacionGateway } from './notificacion.gateway';

@Module({
  providers: [NotificacionGateway, NotificacionService],
  exports: [NotificacionGateway], // Opcional pero buena práctica si otros servicios necesitan enviar notificaciones
})
export class NotificacionModule {}
