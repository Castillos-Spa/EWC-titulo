import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class ListInventoryItemsDto {
  @Transform(({ value }) => (typeof value === 'string' && value.trim().length === 0 ? undefined : value))
  @IsOptional()
  @IsString()
  search?: string;

  @Transform(({ value }) => (typeof value === 'string' && value.trim().length === 0 ? undefined : value))
  @IsOptional()
  @IsString()
  categoria?: string;

  @Transform(({ value }) => (typeof value === 'string' && value.trim().length === 0 ? undefined : value))
  @IsOptional()
  @IsString()
  estado?: InventoryItemStatusLiteral | 'all';
}

type InventoryItemStatusLiteral = 'ACTIVO' | 'INACTIVO';
