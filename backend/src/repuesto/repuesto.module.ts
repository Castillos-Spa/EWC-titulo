import { Module } from '@nestjs/common';
import { RepuestoService } from './repuesto.service';
import { RepuestoController } from './repuesto.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RepuestoController],
  providers: [RepuestoService],
})
export class RepuestoModule {}
