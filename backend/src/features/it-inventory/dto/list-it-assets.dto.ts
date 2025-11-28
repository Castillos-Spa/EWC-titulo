import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

const ALLOWED_CATEGORIES = ['Laptop', 'Monitor', 'Licencia', 'Periférico', 'Desktop', 'Impresora', 'Servidor'] as const;
const ALLOWED_STATUSES = ['EN_STOCK', 'ASIGNADO', 'EN_REPARACION', 'RETIRADO'] as const;

type AllowedCategory = (typeof ALLOWED_CATEGORIES)[number];
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export class ListItAssetsDto {
  @Transform(({ value }) => (typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined))
  @IsOptional()
  @IsString()
  search?: string;

  @Transform(({ value }) => (typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined))
  @IsOptional()
  @IsIn([...ALLOWED_CATEGORIES, 'all'] as const)
  categoria?: AllowedCategory | 'all';

  @Transform(({ value }) => (typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined))
  @IsOptional()
  @IsIn([...ALLOWED_STATUSES, 'all'] as const)
  estado?: AllowedStatus | 'all';
}
