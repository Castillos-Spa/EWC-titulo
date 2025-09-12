import { PartialType } from '@nestjs/mapped-types';
import { CreateSolicitudCompraDto } from './create-solicitud-compra.dto';

export class UpdateSolicitudCompraDto extends PartialType(CreateSolicitudCompraDto) {}
