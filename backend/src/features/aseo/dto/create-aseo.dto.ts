import { IsString, IsArray, IsNumber, IsOptional, IsDateString } from 'class-validator';

export type CleaningStatusString = 'COMPLETED' | 'PARTIAL' | 'PENDING';

export class CreateAseoDto {
  @IsDateString()
  date!: string;
  @IsString()
  area!: string;
  @IsArray()
  @IsOptional()
  tasks?: string[] = [];
  @IsString()
  responsibleStaff!: string;
  @IsNumber()
  timeSpent!: number;
  @IsArray()
  @IsOptional()
  issues?: string[] = [];
  @IsString()
  status!: CleaningStatusString;
  @IsString()
  @IsOptional()
  observations?: string;
}
