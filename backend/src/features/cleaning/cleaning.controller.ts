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
  UseGuards,
  Request,
  UnauthorizedException,
  ParseIntPipe,
} from '@nestjs/common';
import { CleaningService } from './cleaning.service';
import { CreateCleaningDto } from './dto/create-cleaning.dto';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { UpdateCleaningDto } from './dto/update-cleaning.dto';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/features/auth/guards/roles.guard';
import { Roles } from '@/features/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cleaning')
export class CleaningController {
  constructor(private readonly cleaningService: CleaningService) {}

  @Post()
  @Roles(Role.Admin, Role.Supervisor, Role.Trabajador)
  create(@Body() createCleaningDto: CreateCleaningDto, @Request() req) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('No se pudo identificar al usuario creador desde el token.');
    }
    return this.cleaningService.create(createCleaningDto, userId);
  }

  @Get()
  @Roles(Role.Admin, Role.Supervisor, Role.Lector)
  findAll(@Query(new ValidationPipe({ transform: true, whitelist: true })) paginationQuery: PaginationQueryDto) {
    return this.cleaningService.findAll(paginationQuery);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Supervisor, Role.Lector)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cleaningService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Supervisor)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCleaningDto: UpdateCleaningDto, @Request() req) {
    const actorId = req.user?.userId;
    if (!actorId) {
      throw new UnauthorizedException('No se pudo identificar al usuario que actualiza desde el token.');
    }
    return this.cleaningService.update(id, updateCleaningDto, actorId);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Supervisor)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cleaningService.remove(id);
  }
}
