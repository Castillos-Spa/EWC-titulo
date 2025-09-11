import { Controller, Post, Body, Param } from '@nestjs/common';
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
    @Param('otId') otId: string,
    @Body('checklist') checklist: string,
    @Body('resultado') resultado: string,
  ) {
    return this.tallerService.cerrarOrdenTrabajo(+otId, checklist, resultado);
  }
}
