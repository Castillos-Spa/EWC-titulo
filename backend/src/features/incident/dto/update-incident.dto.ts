import { PartialType } from '@nestjs/mapped-types';
import { CreateIncidentDto } from './create-incident.dto';
import { IncidentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

const statusMap: Record<string, IncidentStatus> = {
  reportado: IncidentStatus.REPORTED,
  reported: IncidentStatus.REPORTED,
  acknowledged: IncidentStatus.ACKNOWLEDGED,
  en_progreso: IncidentStatus.IN_PROGRESS,
  'en progreso': IncidentStatus.IN_PROGRESS,
  in_progress: IncidentStatus.IN_PROGRESS,
  resuelto: IncidentStatus.RESOLVED,
  resolved: IncidentStatus.RESOLVED,
};

export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {
  @Transform(({ obj, value }) => {
    const raw = (value ?? obj.status ?? obj.Status) as string | undefined;
    if (!raw) return undefined;
    const normalized = raw.trim().toLowerCase();
    return statusMap[normalized] ?? (raw.toUpperCase() as IncidentStatus);
  })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;
}
