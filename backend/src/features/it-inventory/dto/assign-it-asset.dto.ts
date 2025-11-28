import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AssignItAssetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  usuario!: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  detalle?: string;
}
