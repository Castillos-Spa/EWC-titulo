import { Transform, Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, Min } from 'class-validator';

const DASHBOARD_MODULES = [
  'transport',
  'maintenance',
  'tickets',
  'cleaning',
  'civilWorks',
  'incidents',
  'notifications',
  'users',
] as const;

export type DashboardModuleKey = (typeof DASHBOARD_MODULES)[number];

export class DashboardOverviewQueryDto {
  @IsOptional()
  @IsArray()
  @IsIn(DASHBOARD_MODULES, { each: true })
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
  modules?: DashboardModuleKey[];

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
  driversPageSize?: number;

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
  ticketsPage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ticketsPageSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cleaningPage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cleaningPageSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  civilWorksPage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  civilWorksPageSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  incidentsPage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  incidentsPageSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  notificationsPage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  notificationsPageSize?: number;

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
}
