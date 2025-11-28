import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsArray,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { CivilWorkStatus, CivilWorkType } from '@prisma/client';

class MaterialDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;
}

export class CreateCivilWorkDto {
  @IsString()
  @IsNotEmpty()
  project: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  estimatedEndDate: string;

  @IsEnum(CivilWorkType)
  workType: CivilWorkType;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tasks?: string[];

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

  @IsEnum(CivilWorkStatus)
  @IsOptional()
  status?: CivilWorkStatus;

  @IsString()
  @IsOptional()
  observations?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  issues?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];

  // Cambiamos responsibleStaffIds por responsibleStaffUsernames
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  responsibleStaffUsernames?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  materialsUsed?: string[];
}
