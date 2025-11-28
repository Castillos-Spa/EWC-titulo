import { PartialType } from '@nestjs/mapped-types';
import { CreateCivilWorkDto } from './create-civil-work.dto';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdateCivilWorkDto extends PartialType(CreateCivilWorkDto) {
  @IsOptional()
  @IsDateString()
  actualEndDate?: string | null;
}
