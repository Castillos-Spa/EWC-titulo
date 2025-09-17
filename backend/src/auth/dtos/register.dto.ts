import { IsString, IsNotEmpty, IsEmail, MinLength, IsArray, IsBoolean, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string; // nombre completo o alias

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  area: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}
