import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { RouteFrequency } from '@prisma/client';

export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsNumber()
  distanceKm: number;

  @IsEnum(RouteFrequency)
  frequency: RouteFrequency;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
