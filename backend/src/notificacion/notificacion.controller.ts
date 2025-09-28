import { Controller, Param, Patch, UseGuards, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { NotificacionService } from './notificacion.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificacionController {
  constructor(private readonly notificacionService: NotificacionService) {}

  @Patch(':id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number) {
    const notification = await this.notificacionService.markAsRead(id);
    if (!notification) throw new NotFoundException('Notificación no encontrada');
    return { message: 'Notificación marcada como leída' };
  }
}
