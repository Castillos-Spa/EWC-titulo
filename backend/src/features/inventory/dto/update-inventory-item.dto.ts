import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { CreateInventoryItemDto } from './create-inventory-item.dto';

export class UpdateInventoryItemDto extends PartialType(CreateInventoryItemDto) {
  @Transform(({ value }) => (value === undefined || value === null ? value : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(0)
  override stockInicial?: number;

  @Transform(({ value }) => (value === undefined || value === null ? value : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(0)
  override stockMinimo?: number;
}
