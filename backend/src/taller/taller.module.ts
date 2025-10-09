import { Module } from '@nestjs/common';
import { TallerService } from './taller.service';
import { TallerController } from './taller.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { OrdenTrabajoModule } from '@/orden-trabajo/orden-trabajo.module';
import { VehiculoModule } from '../vehiculo/vehiculo.module';
import { QaModule } from '../qa/qa.module';

@Module({
  imports: [PrismaModule, OrdenTrabajoModule, VehiculoModule, QaModule],
  controllers: [TallerController],
  providers: [TallerService],
  exports: [
    TallerService, // Export TallerService if it needs to be used by other modules
    OrdenTrabajoModule, // Export OrdenTrabajoModule if its services are used elsewhere
  ],
})
export class TallerModule {}
