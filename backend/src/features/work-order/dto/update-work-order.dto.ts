import { IsOptional, IsString } from 'class-validator';

export class UpdateWorkOrderDto {
  @IsString()
  @IsOptional()
  estado?: string;
}
