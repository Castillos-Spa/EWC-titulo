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
import { AseoService } from './aseo.service';
import { CreateAseoDto } from './dto/create-aseo.dto';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { UpdateAseoDto } from './dto/update-aseo.dto';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/features/auth/guards/roles.guard';
import { Roles } from '@/features/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('aseo')
export class AseoController {
  constructor(private readonly aseoService: AseoService) {}

  @Post()
  @Roles(Role.Admin, Role.Supervisor, Role.Trabajador)
  create(@Body() createAseoDto: CreateAseoDto, @Request() req) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('No se pudo identificar al usuario creador desde el token.');
    }
    return this.aseoService.create(createAseoDto, userId);
  }

  @Get()
  @Roles(Role.Admin, Role.Supervisor, Role.Lector)
  findAll(@Query(new ValidationPipe({ transform: true, whitelist: true })) paginationQuery: PaginationQueryDto) {
    return this.aseoService.findAll(paginationQuery);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Supervisor, Role.Lector)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.aseoService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Supervisor)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateAseoDto: UpdateAseoDto, @Request() req) {
    const actorId = req.user?.userId;
    if (!actorId) {
      throw new UnauthorizedException('No se pudo identificar al usuario que actualiza desde el token.');
    }
    return this.aseoService.update(id, updateAseoDto, actorId);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Supervisor)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.aseoService.remove(id);
  }
}
