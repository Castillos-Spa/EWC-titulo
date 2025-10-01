import { IsNotEmpty, IsNumber, IsDateString, IsOptional, IsString, IsInt } from 'class-validator';

export class CreateFuelLogDto {
  @IsNotEmpty()
  @IsInt()
  vehiculoId: number;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsNumber()
  liters: number;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsNotEmpty()
  @IsNumber()
  odometer: number;

  @IsOptional()
  @IsString()
  invoiceUrl?: string;
}
