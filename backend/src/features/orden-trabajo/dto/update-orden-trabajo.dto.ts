import { IsOptional, IsString } from 'class-validator';

export class UpdateOrdenTrabajoDto {
  @IsString()
  @IsOptional()
  estado?: string;
}
