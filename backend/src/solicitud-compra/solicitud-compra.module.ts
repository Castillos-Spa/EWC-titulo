import { Module } from '@nestjs/common';
import { SolicitudCompraService } from './solicitud-compra.service';
import { SolicitudCompraController } from './solicitud-compra.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SolicitudCompraController],
  providers: [SolicitudCompraService],
})
export class SolicitudCompraModule {}
