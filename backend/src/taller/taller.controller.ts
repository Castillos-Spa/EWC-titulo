import { Controller, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { TallerService } from './taller.service';
import { CreateOrdenTrabajoTallerDto } from './dto/create-taller.dto';

@Controller('taller')
export class TallerController {
  constructor(private readonly tallerService: TallerService) {}

  @Post('orden-trabajo')
  crearOrdenTrabajo(@Body() createOrdenTrabajoTallerDto: CreateOrdenTrabajoTallerDto) {
    return this.tallerService.crearOrdenTrabajo(createOrdenTrabajoTallerDto);
  }

  @Post('orden-trabajo/:otId/cerrar')
  cerrarOrdenTrabajo(
    @Param('otId', ParseIntPipe) otId: number,
    @Body('checklist') checklist: string,
    @Body('resultado') resultado: string,
  ) {
    return this.tallerService.cerrarOrdenTrabajo(otId, checklist, resultado);
  }
}
