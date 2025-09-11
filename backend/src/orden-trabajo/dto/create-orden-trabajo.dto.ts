import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateOrdenTrabajoDto {
  @IsInt()
  @IsNotEmpty()
  vehiculoId: number;

  @IsString()
  @IsNotEmpty()
  tipo: string;
}
