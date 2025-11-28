import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UnassignItAssetDto {
  @IsOptional()
  @IsString()
  @MaxLength(256)
  detalle?: string;
}
