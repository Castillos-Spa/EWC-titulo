import { Module } from '@nestjs/common';
import { TallerService } from './taller.service';
import { TallerController } from './taller.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { QaModule } from '@/qa/qa.module';
import { QaService } from '@/qa/qa.service';
import { OrdenTrabajoModule } from '@/orden-trabajo/orden-trabajo.module';
import { VehiculoModule } from '../vehiculo/vehiculo.module';
import { SolicitudCompraModule } from '../solicitud-compra/solicitud-compra.module';
import { RepuestoModule } from '../repuesto/repuesto.module';

@Module({
  imports: [PrismaModule, QaModule, OrdenTrabajoModule, VehiculoModule, SolicitudCompraModule, RepuestoModule],
  controllers: [TallerController],
  providers: [TallerService, { provide: 'IQaService', useClass: QaService }],
  exports: [
    TallerService, // Export TallerService if it needs to be used by other modules
    OrdenTrabajoModule, // Export OrdenTrabajoModule if its services are used elsewhere
    QaModule, // Export QaModule if its services are used elsewhere
  ],
})
export class TallerModule {}
