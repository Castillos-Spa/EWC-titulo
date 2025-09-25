import { TicketPriority, TicketStatus } from '@prisma/client';
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
  @IsNotEmpty()
  recipientArea: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
