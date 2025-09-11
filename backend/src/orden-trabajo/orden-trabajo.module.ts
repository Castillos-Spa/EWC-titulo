import { Module } from '@nestjs/common';
import { OrdenTrabajoService } from './orden-trabajo.service';
import { OrdenTrabajoController } from './orden-trabajo.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrdenTrabajoController],
  providers: [OrdenTrabajoService],
  exports: [OrdenTrabajoService],
})
export class OrdenTrabajoModule {}
