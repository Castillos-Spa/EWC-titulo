import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateItAssetDto, IT_ASSET_ALLOWED_CATEGORIES } from './create-it-asset.dto';

const ALLOWED_STATUSES = ['EN_STOCK', 'ASIGNADO', 'EN_REPARACION', 'RETIRADO'] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export class UpdateItAssetDto extends PartialType(CreateItAssetDto) {
  @IsOptional()
  @IsIn(IT_ASSET_ALLOWED_CATEGORIES as unknown as readonly string[])
  override categoria?: (typeof IT_ASSET_ALLOWED_CATEGORIES)[number];

  @IsOptional()
  @IsEnum(ALLOWED_STATUSES)
  override estado?: AllowedStatus;

  @IsOptional()
  @IsISO8601()
  @Transform(({ value }) => (typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined))
  override fechaCompra?: string;

  @IsOptional()
  @IsISO8601()
  @Transform(({ value }) => (typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined))
  override garantiaHasta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  override ubicacion?: string;
}
