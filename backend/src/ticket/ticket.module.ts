import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { NotificacionModule } from '@/notificacion/notificacion.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [NotificacionModule, PrismaModule],
  controllers: [TicketController],
  providers: [TicketService],
})
export class TicketModule {}
