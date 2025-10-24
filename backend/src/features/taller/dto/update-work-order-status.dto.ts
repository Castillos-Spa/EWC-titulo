import { IsEnum } from 'class-validator';
import { OrdenTrabajoEstado } from '../../orden-trabajo/orden-trabajo.service';

export class UpdateWorkOrderStatusDto {
  @IsEnum(OrdenTrabajoEstado, { message: 'El estado proporcionado no es válido.' })
  estado: OrdenTrabajoEstado;
}
