import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, IsEnum, IsISO8601 } from 'class-validator';

const ALLOWED_CATEGORIES = ['Laptop', 'Monitor', 'Licencia', 'Periférico', 'Desktop', 'Impresora', 'Servidor'] as const;
const ALLOWED_STATUSES = ['EN_STOCK', 'ASIGNADO', 'EN_REPARACION', 'RETIRADO'] as const;

type AllowedCategory = (typeof ALLOWED_CATEGORIES)[number];
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export class CreateItAssetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  assetTag!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  serialNumber?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  nombre!: string;

  @IsIn(ALLOWED_CATEGORIES as unknown as readonly string[])
  categoria!: AllowedCategory;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  ubicacion!: string;

  @IsOptional()
  @IsEnum(ALLOWED_STATUSES)
  estado?: AllowedStatus;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  asignadoA?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  proveedor?: string;

  @IsOptional()
  @IsISO8601()
  @Transform(({ value }) => (typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined))
  fechaCompra?: string;

  @IsOptional()
  @IsISO8601()
  @Transform(({ value }) => (typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined))
  garantiaHasta?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}

export { ALLOWED_CATEGORIES as IT_ASSET_ALLOWED_CATEGORIES };
