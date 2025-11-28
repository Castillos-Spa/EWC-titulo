import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWorkOrderDto {
  @IsInt()
  vehiculoId: number;

  @IsString()
  @IsEnum(['Preventivo', 'Correctivo', 'Emergencia'])
  tipo: 'Preventivo' | 'Correctivo' | 'Emergencia';

  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  repuestos?: string[];

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsInt()
  responsableId?: number; // ID del mecánico

  @IsOptional()
  @IsNumber()
  estimatedCost?: number;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsDateString()
  nextServiceDate?: string;
}
