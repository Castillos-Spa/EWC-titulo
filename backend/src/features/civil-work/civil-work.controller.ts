import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
  ParseIntPipe,
  UseGuards,
  Request,
  UnauthorizedException,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { CivilWorkService } from './civil-work.service';
import { CreateCivilWorkDto } from './dto/create-civil-work.dto';
import { UpdateCivilWorkDto } from './dto/update-civil-work.dto';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/features/auth/guards/roles.guard';
import { AreaGuard } from '@/features/auth/guards/area.guard';

import { Roles } from '@/features/auth/decorators/roles.decorator'; // Asumo que tienes este decorador
import { Area } from '@/features/auth/decorators/area.decorator';
import { Role } from '@prisma/client';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Express } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard, AreaGuard)
@Controller('civil-work')
export class CivilWorkController {
  constructor(private readonly civilWorkService: CivilWorkService) {}

  @Post()
  @Roles(Role.Admin, Role.Jefe)
  @Area('Obras')
  create(@Body() createCivilWorkDto: CreateCivilWorkDto, @Request() req) {
    // Obtenemos el ID del usuario desde el objeto `req` que inyecta el `JwtAuthGuard`.
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('No se pudo identificar al usuario creador desde el token.');
    }
    return this.civilWorkService.create(createCivilWorkDto, userId);
  }

  @Get()
  findAll(@Query(new ValidationPipe({ transform: true, whitelist: true })) paginationQuery: PaginationQueryDto) {
    return this.civilWorkService.findAll(paginationQuery);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.civilWorkService.findOne(id);
  }

  @Get(':id/photos')
  @Roles(Role.Admin, Role.Jefe, Role.Supervisor)
  @Area('Obras')
  async getPhotos(@Param('id', ParseIntPipe) id: number) {
    const photos = await this.civilWorkService.getSignedPhotos(id);
    return { id, photos };
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @Area('Obras')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCivilWorkDto: UpdateCivilWorkDto) {
    return this.civilWorkService.update(id, updateCivilWorkDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @Area('Obras')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.civilWorkService.remove(id);
  }

  @Patch(':id/tasks')
  @Roles(Role.Admin, Role.Jefe, Role.Supervisor)
  updateTasks(@Param('id', ParseIntPipe) id: number, @Body('tasks') tasks: { name: string; completed: boolean }[]) {
    return this.civilWorkService.updateTasks(id, tasks);
  }

  @Post(':id/photos')
  @Roles(Role.Admin, Role.Jefe, Role.Supervisor)
  @Area('Obras')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 7 * 1024 * 1024 },
    }),
  )
  uploadPhotos(@Param('id', ParseIntPipe) id: number, @UploadedFiles() files: Express.Multer.File[]) {
    return this.civilWorkService.addPhotos(id, files);
  }
}
