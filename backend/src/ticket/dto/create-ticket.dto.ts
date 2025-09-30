import { TicketPriority, Role } from '@prisma/client';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTicketDto {
  @IsNotEmpty()
  title: string;
  @IsOptional()
  description?: string | null;
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
  @IsNotEmpty()
  category: string;
  @IsOptional()
  assignedToId?: number;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipientArea?: string[];
  // 🎯 NUEVO: Añadir recipientRole
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  recipientRole?: Role[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
