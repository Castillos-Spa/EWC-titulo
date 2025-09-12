import { IsBoolean, IsNumber, IsString } from 'class-validator';
//TODO Definir que campos no seran empty o null
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
export class CreateOrdenTrabajo {
  @IsString()
  vehiculoId: string;
  @IsString()
  tipo: string;
  @IsBoolean()
  estado: boolean;
}
export class CreateQA {
  @IsNumber()
  OTid: number;
  @IsString()
  resultado: string;
}

export class CreateRepuesto {
  @IsString()
  nombre: string;
  @IsNumber()
  stock: number;
  @IsNumber()
  costoUnitario: number;
}
