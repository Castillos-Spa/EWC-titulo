import { Area, IncidentSeverity, IncidentType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';

const severityMap: Record<string, IncidentSeverity> = {
  critico: IncidentSeverity.CRITICAL,
  crítico: IncidentSeverity.CRITICAL,
  alto: IncidentSeverity.HIGH,
  medio: IncidentSeverity.MEDIUM,
  bajo: IncidentSeverity.LOW,
};

const normalizeString = (value?: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  return undefined;
};

export class CreateIncidentDto {
  @Transform(({ obj, value }) => normalizeString(value ?? obj.title ?? obj.Titulo ?? obj.titulo ?? obj.Area), {
    toClassOnly: true,
  })
  @IsString()
  title!: string;

  @Transform(({ obj, value }) => normalizeString(value ?? obj.description ?? obj.Descripcion), {
    toClassOnly: true,
  })
  @IsString()
  description!: string;

  @Transform(({ obj, value }) => normalizeString(value ?? obj.area ?? obj.Area), {
    toClassOnly: true,
  })
  @IsEnum(Area)
  area!: Area;

  @Transform(({ obj, value }) => normalizeString(value ?? obj.type ?? obj.Tipo), {
    toClassOnly: true,
  })
  @IsEnum(IncidentType)
  type!: IncidentType;

  @Transform(({ obj, value }) => {
    const candidate = normalizeString(value ?? obj.severity ?? obj.Severidad);
    if (!candidate) return candidate;
    const normalized = candidate.toLowerCase();
    return severityMap[normalized] ?? (candidate.toUpperCase() as IncidentSeverity);
  })
  @IsEnum(IncidentSeverity)
  severity!: IncidentSeverity;

  @Transform(({ obj, value }) => normalizeString(value ?? obj.address ?? obj.Direccion), {
    toClassOnly: true,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @Transform(({ obj, value }) => value ?? obj.latitude ?? obj.Latitude)
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @Transform(({ obj, value }) => value ?? obj.longitude ?? obj.Longitude)
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @Transform(({ obj, value }) => value ?? obj.reportedAt ?? obj.Fecha)
  @IsOptional()
  @IsISO8601()
  reportedAt?: string;
}
