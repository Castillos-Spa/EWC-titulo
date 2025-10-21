import { Module } from '@nestjs/common';
import { RutasService } from './rutas.service';
import { RutasController } from './rutas.controller';

@Module({
  imports: [],
  controllers: [RutasController],
  providers: [RutasService],
})
export class RutasModule {}
