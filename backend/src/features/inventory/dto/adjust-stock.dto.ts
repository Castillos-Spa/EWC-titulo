import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, NotEquals } from 'class-validator';

export class AdjustStockDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @NotEquals(0)
  cantidad!: number;

  @IsString()
  @IsNotEmpty()
  motivo!: string;
}
