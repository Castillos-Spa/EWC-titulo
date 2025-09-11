import { Module } from '@nestjs/common';
import { TallerService } from './taller.service';
import { TallerController } from './taller.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { QaModule } from '@/qa/qa.module';
import { QaService } from '@/qa/qa.service';
import { OrdenTrabajoModule } from '@/orden-trabajo/orden-trabajo.module';

@Module({
  imports: [PrismaModule, QaModule, OrdenTrabajoModule],
  controllers: [TallerController],
  providers: [TallerService, { provide: 'IQaService', useClass: QaService }],
})
export class TallerModule {}
