import { IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';

export class CreateIncidentDto {
  @IsString()
  Area: string;
  @IsString()
  Descripcion: string;
  @IsDateString()
  Fecha: string;
  @IsString()
  Tipo: string;
  @IsString()
  Severidad: 'Critico' | 'Alto' | 'Medio' | 'Bajo';
  @IsString()
  @IsOptional()
  Direccion?: string;
  @IsOptional()
  @IsNumber()
  Latitude?: number;
  @IsOptional()
  @IsNumber()
  Longitude?: number;
}
