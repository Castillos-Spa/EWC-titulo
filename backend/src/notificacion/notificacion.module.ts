import { Module } from '@nestjs/common';
import { NotificacionService } from './notificacion.service';
import { NotificacionGateway } from './notificacion.gateway';
import { PrismaModule } from 'prisma/prisma.module';
import { NotificacionController } from './notificacion.controller';

@Module({
  imports: [PrismaModule],
  providers: [NotificacionGateway, NotificacionService],
  controllers: [NotificacionController],
  exports: [NotificacionGateway, NotificacionService],
})
export class NotificacionModule {}
