import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  ParseIntPipe,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { NotificacionService } from './notificacion.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';
import { Roles } from '@/features/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('notificacion')
export class NotificacionController {
  constructor(private readonly notificacionService: NotificacionService) {}

  @Post()
  @Roles(Role.Admin)
  create(@Body() createNotificationDto: CreateNotificationDto, @Request() req) {
    return this.notificacionService.createCustomNotification(createNotificationDto, req.user.userId);
  }

  @Get()
  findAll(
    @Request() req,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) paginationQuery: PaginationQueryDto,
  ) {
    return this.notificacionService.findAllForUser(req.user.userId, paginationQuery);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateNotificationDto: UpdateNotificationDto, @Request() req) {
    // Un usuario solo puede marcar como leída una notificación para sí mismo.
    if (updateNotificationDto.read && Object.keys(updateNotificationDto).length === 1) {
      return this.notificacionService.markAsRead(id, req.user.userId);
    }

    // Solo los admins pueden editar el resto de la notificación.
    const roleAssignments = Array.isArray(req.user?.roleAssignments) ? req.user.roleAssignments : [];
    const isAdmin = roleAssignments.some(ra => ra.role === Role.Admin);
    if (isAdmin) {
      // Excluimos 'read' porque se maneja por separado
      const { read, ...rest } = updateNotificationDto;
      return this.notificacionService.update(id, rest);
    }

    throw new ForbiddenException('No tienes permisos para editar esta notificación.');
  }
}
