import { Inject, Injectable } from '@nestjs/common';
import { OrdenTrabajoService } from '../orden-trabajo/orden-trabajo.service';
import { CreateOrdenTrabajoTallerDto } from './dto/create-taller.dto';
import type { IQaService } from './interfaces/qa.interface';

@Injectable()
export class TallerService {
  constructor(
    private readonly ordenTrabajoService: OrdenTrabajoService,
    @Inject('IQaService') private readonly qaService: IQaService,
  ) {}

  // Crear una orden de trabajo desde el taller
  async crearOrdenTrabajo(createOrdenTrabajoTallerDto: CreateOrdenTrabajoTallerDto) {
    return this.ordenTrabajoService.create(createOrdenTrabajoTallerDto);
  }

  // Cerrar una orden de trabajo desde el taller
  async cerrarOrdenTrabajo(otId: number, checklist: string, resultado: string) {
    // Actualizar el estado de la OT a "Cerrada"
    await this.ordenTrabajoService.update(otId, { estado: 'Cerrada' });

    // Crear el registro en QA
    return this.qaService.create({
      otId: otId, // Asegúrate de incluir el otId
      checklist: checklist,
      resultado: resultado,
    });
  }
}
