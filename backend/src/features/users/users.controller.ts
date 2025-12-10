import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { UsersService } from './users.service';
import { RegisterDto } from '../auth/dtos/register.dto';
import { Role, Specialty } from '@prisma/client';
import { SimpleCacheInterceptor } from 'src/common/simple-cache.interceptor';
import { CacheTTL } from 'src/common/cache-ttl.decorator';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Express } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseInterceptors(SimpleCacheInterceptor)
  @CacheTTL(10)
  async findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    paginationQuery: PaginationQueryDto,
    @Query('specialty') specialty?: Specialty,
  ) {
    return this.usersService.findAll({ ...paginationQuery, specialty });
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
  async create(@Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) registerDto: RegisterDto) {
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

    if (!userId || userId <= 0) {
      throw new ForbiddenException('ID de usuario inválido');
    }

    // Un usuario puede cambiar su propia contraseña, o un admin puede cambiar la de cualquiera.

    if (requestingUser.userId !== userId && !requestingUser.roles.includes(Role.Admin)) {
      throw new ForbiddenException('No tienes permiso para cambiar la contraseña de este usuario.');
    }
    return this.usersService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

  @Patch('me/profile')
  async updateOwnProfile(
    @Request() req,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) dto: UpdateProfileDto,
  ) {
    const { userId, roles } = req.user;
    return this.usersService.updateProfile(userId, dto, { userId, roles });
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 7 * 1024 * 1024 },
    }),
  )
  async uploadOwnAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    const { userId, roles } = req.user;
    return this.usersService.updateAvatar(userId, file, { userId, roles });
  }

  @Put(':id/regenerate-password')
  async regeneratePassword(@Param('id') id: string) {
    return this.usersService.regenerateTempPassword(Number(id));
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) data: UpdateUserDto,
  ) {
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
