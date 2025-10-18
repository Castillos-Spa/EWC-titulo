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
} from '@nestjs/common';
import { VehiculoService } from './vehiculo.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('vehiculos')
export class VehiculoController {
  constructor(private readonly vehiculoService: VehiculoService) {}

  @Post()
  create(@Body() createVehiculoDto: CreateVehiculoDto) {
    return this.vehiculoService.create(createVehiculoDto);
  }

  @Get()
  findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    paginationQuery: PaginationQueryDto,
  ) {
    return this.vehiculoService.findAll(paginationQuery);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiculoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateVehiculoDto: UpdateVehiculoDto) {
    return this.vehiculoService.update(id, updateVehiculoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehiculoService.remove(id);
  }
}
