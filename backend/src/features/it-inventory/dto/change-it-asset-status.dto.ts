import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const ALLOWED_STATUSES = ['EN_STOCK', 'ASIGNADO', 'EN_REPARACION', 'RETIRADO'] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export class ChangeItAssetStatusDto {
  @IsEnum(ALLOWED_STATUSES)
  estado!: AllowedStatus;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  detalle?: string;
}
