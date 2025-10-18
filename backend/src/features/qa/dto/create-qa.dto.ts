import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreateQADto {
  @IsInt()
  @IsNotEmpty()
  otId: number;

  @IsString()
  @IsNotEmpty()
  checklist: string;

  @IsString()
  @IsNotEmpty()
  resultado: string;
}
