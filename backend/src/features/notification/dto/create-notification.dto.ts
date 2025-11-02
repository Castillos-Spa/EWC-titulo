import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsDateString } from 'class-validator';

class NotificationTargetDto {
  @IsString()
  scope: 'global' | 'areas' | 'roles';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areas?: string[];
}

export class CreateNotificationDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() message: string;
  @IsString() @IsNotEmpty() priority: 'low' | 'normal' | 'high';
  @IsOptional() target: NotificationTargetDto;
  @IsOptional() @IsDateString() scheduledAt?: string;
}
