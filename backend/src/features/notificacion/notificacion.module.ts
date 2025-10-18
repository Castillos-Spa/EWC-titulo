import { Module } from '@nestjs/common';
import { NotificacionService } from './notificacion.service';
import { NotificacionGateway } from './notificacion.gateway';
import { NotificacionController } from './notificacion.controller';

@Module({
  imports: [],
  providers: [NotificacionGateway, NotificacionService],
  controllers: [NotificacionController],
  exports: [NotificacionGateway, NotificacionService],
})
export class NotificacionModule {}
