import { Module } from '@nestjs/common';
import { VehiculoService } from './vehiculo.service';
import { VehiculoController } from './vehiculo.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VehiculoController],
  providers: [VehiculoService],
})
export class VehiculoModule {}
