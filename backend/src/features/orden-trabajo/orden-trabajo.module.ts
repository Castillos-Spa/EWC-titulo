import { Module } from '@nestjs/common';
import { OrdenTrabajoService } from './orden-trabajo.service';

@Module({
  providers: [OrdenTrabajoService],
  exports: [OrdenTrabajoService],
})
export class OrdenTrabajoModule {}
