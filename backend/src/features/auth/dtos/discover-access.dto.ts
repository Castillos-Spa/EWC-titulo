import { IsEmail, IsOptional, IsString } from 'class-validator';

export class DiscoverAccessDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  tenantSlug?: string;
}
