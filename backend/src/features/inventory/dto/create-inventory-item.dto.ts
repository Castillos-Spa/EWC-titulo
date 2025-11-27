import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateInventoryItemDto {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  categoria!: string;

  @IsString()
  @IsNotEmpty()
  ubicacion!: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  stockInicial!: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  stockMinimo!: number;

  @IsString()
  @IsNotEmpty()
  unidadMedida!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
