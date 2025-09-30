import { IsBoolean, IsOptional, IsString } from 'class-validator';
export class ApproveStepDto {
  @IsBoolean()
  approved: boolean;

  @IsString()
  @IsOptional()
  comments?: string;
}
