import { Transform, Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, Min } from 'class-validator';

const WORKSHOP_OVERVIEW_SECTIONS = ['workOrders', 'vehicles', 'users', 'mechanics'] as const;
export type WorkshopOverviewSection = (typeof WORKSHOP_OVERVIEW_SECTIONS)[number];

export class WorkshopOverviewQueryDto {
  @IsOptional()
  @IsArray()
  @IsIn(WORKSHOP_OVERVIEW_SECTIONS, { each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string' && value.length > 0) {
      return value
        .split(',')
        .map(segment => segment.trim())
        .filter(Boolean);
    }
    return undefined;
  })
  include?: WorkshopOverviewSection[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  workOrdersPage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  workOrdersPageSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vehiclesPage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vehiclesPageSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usersPage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usersPageSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  mechanicsPageSize?: number;
}
