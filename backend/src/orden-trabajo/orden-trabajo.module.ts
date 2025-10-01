import { Module, forwardRef } from '@nestjs/common';
import { OrdenTrabajoService } from './orden-trabajo.service';
import { PrismaModule } from 'prisma/prisma.module';
import { TicketModule } from '../ticket/ticket.module';

@Module({
  imports: [PrismaModule, forwardRef(() => TicketModule)],
  providers: [OrdenTrabajoService],
  exports: [OrdenTrabajoService],
})
export class OrdenTrabajoModule {}
