import { Module, forwardRef } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { NotificacionModule } from '@/notificacion/notificacion.module';
import { OrdenTrabajoModule } from '../orden-trabajo/orden-trabajo.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [NotificacionModule, PrismaModule, forwardRef(() => OrdenTrabajoModule)],
  controllers: [TicketController],
  providers: [TicketService],
  exports: [TicketService],
})
export class TicketModule {}
