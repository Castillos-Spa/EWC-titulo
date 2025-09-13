import { IsNumber, IsString } from 'class-validator';
export class CreateVehiculoDto {
  @IsString()
  patente: string;
  @IsNumber()
  capacidad: number;
  @IsNumber()
  odometro: number;
  @IsString()
  estado: 'disponible' | 'en_mantenimiento' | 'inactivo' | 'en_uso';
}
