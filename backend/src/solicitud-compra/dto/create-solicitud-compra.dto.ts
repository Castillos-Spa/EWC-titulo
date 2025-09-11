import { CreateRepuestoDto } from '@/repuesto/dto/create-repuesto.dto';
import { Type } from 'class-transformer';
import { IsNumber, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';

export class CreateSolicitudCompraDto {
  @IsNumber()
  @IsNotEmpty()
  monto: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRepuestoDto)
  repuestos?: CreateRepuestoDto[];
}
