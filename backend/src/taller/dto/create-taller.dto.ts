import { IsInt, IsString } from 'class-validator';

export class CreateOrdenTrabajoTallerDto {
  @IsInt()
  vehiculoId: number;

  @IsString()
  tipo: string;
}
