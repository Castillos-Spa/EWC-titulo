import { IsOptional, IsString, IsEmail, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(190)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
