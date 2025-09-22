import { Controller, Get, Post, Put, Patch, Delete, Param, Body, ForbiddenException, Request } from '@nestjs/common';

import { UsersService } from './users.service';
import { RegisterDto } from '../auth/dtos/register.dto';
import { Role } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }
  // Endpoint para obtener la contraseña temporal (solo si mustChangePassword=true)
  @Get(':id/temp-password')
  async getTempPassword(@Param('id') id: string) {
    const user = await this.usersService.findById(Number(id));
    // Solo permitir si mustChangePassword está en true
    if (!user || !user.mustChangePassword) {
      throw new ForbiddenException('No hay contraseña temporal disponible');
    }
    // Busca si hay una contraseña temporal generada (opcional: podrías guardar en otro campo si quieres más seguridad)
    // Aquí simplemente devolvemos un mensaje, pero podrías guardar la temporal en un campo aparte si quieres mostrarla solo una vez
    // Por ahora, no se puede recuperar la contraseña original, solo la generada en el response de creación
    return { message: 'Por seguridad, la contraseña temporal solo se muestra al crear el usuario.' };
  }
  @Post()
  async create(@Body() registerDto: RegisterDto) {
    return this.usersService.register(registerDto);
  }

  @Patch(':id/password')
  async changePassword(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: { currentPassword: string; newPassword: string },
  ) {
    const userId = Number(id);
    const requestingUser = req.user;

    // Un usuario puede cambiar su propia contraseña, o un admin puede cambiar la de cualquiera.
    if (requestingUser.userId !== userId && !requestingUser.roles.includes(Role.Admin)) {
      throw new ForbiddenException('No tienes permiso para cambiar la contraseña de este usuario.');
    }

    if (!userId || userId <= 0) {
      throw new ForbiddenException('ID de usuario inválido');
    }
    return this.usersService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

  @Put(':id/regenerate-password')
  async regeneratePassword(@Param('id') id: string) {
    return this.usersService.regenerateTempPassword(Number(id));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: Partial<RegisterDto>) {
    // Implementa update en el service
    return this.usersService.updateUser(Number(id), data);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const requestingUser = req.user;

    // Solo un Admin puede eliminar usuarios.
    if (!requestingUser.roles.includes(Role.Admin)) {
      throw new ForbiddenException('No tienes permiso para eliminar usuarios.');
    }

    const idToDelete = Number(id);
    return this.usersService.deleteUser(idToDelete, requestingUser.userId);
  }
}
