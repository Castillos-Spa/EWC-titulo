import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateRepuestoDto {
  @IsString()
  nombre: string;

  @IsNumber()
  stock: number;

  @IsNumber()
  costoUnitario: number;

  @IsOptional()
  @IsNumber()
  solicitudCompraId?: number;
}
