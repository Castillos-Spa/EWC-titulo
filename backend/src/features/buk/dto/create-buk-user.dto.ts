import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBukUserDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  id_buk!: number;
}
