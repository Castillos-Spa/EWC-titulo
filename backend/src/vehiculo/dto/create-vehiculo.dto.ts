import { IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';
export class CreateVehiculoDto {
  @IsString()
  patente: string;

  @IsString()
  @IsOptional()
  codigo?: string;

  @IsString()
  @IsOptional()
  tipo?: string;

  @IsString()
  marca: string;

  @IsString()
  modelo: string;

  @IsNumber()
  capacidad: number;

  @IsNumber()
  odometro: number;

  @IsString()
  estado: 'disponible' | 'en_mantenimiento' | 'inactivo' | 'en_uso';

  @IsString()
  @IsOptional()
  areaAsignada?: string;

  @IsNumber()
  @IsOptional()
  conductorId?: number;

  @IsDateString()
  @IsOptional()
  lastMaintenanceDate?: Date;
}
