import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { CivilWorkService } from './civil-work.service';
import { CreateCivilWorkDto } from './dto/create-civil-work.dto';
import { UpdateCivilWorkDto } from './dto/update-civil-work.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AreaGuard } from 'src/auth/guards/area.guard';

import { Roles } from 'src/auth/decorators/roles.decorator'; // Asumo que tienes este decorador
import { Area } from 'src/auth/decorators/area.decorator';
import { Role } from '@prisma/client';
import type { User } from '@prisma/client';

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
  findAll(@Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    const skip = (Number(page) - 1) * Number(pageSize);
    return this.civilWorkService.findAll({
      skip,
      take: Number(pageSize),
      orderBy: { startDate: 'desc' },
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.civilWorkService.findOne(id);
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
}
