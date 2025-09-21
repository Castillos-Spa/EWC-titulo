import { Module } from '@nestjs/common';
import { NotificacionService } from './notificacion.service';
import { NotificacionGateway } from './notificacion.gateway';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [NotificacionGateway, NotificacionService],
  exports: [NotificacionGateway, NotificacionService],
})
export class NotificacionModule {}
