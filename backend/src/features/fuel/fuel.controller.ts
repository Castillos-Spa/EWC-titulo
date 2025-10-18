import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
  Query,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { FuelService } from './fuel.service';
import { CreateFuelLogDto } from './dto/create-fuel-log.dto';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('fuel')
export class FuelController {
  constructor(private readonly fuelService: FuelService) {}

  @Post('log')
  create(@Body() createFuelLogDto: CreateFuelLogDto, @Request() req) {
    const driverId = req.user.userId;
    return this.fuelService.createFuelLog(createFuelLogDto, driverId);
  }

  @Get('summary')
  getFleetSummary(
    @Request() req,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) paginationQuery: PaginationQueryDto,
  ) {
    const userId = req.user.userId;
    return this.fuelService.getFleetFuelSummary(userId, paginationQuery);
  }

  @Get('history/:vehiculoId')
  getVehicleHistory(
    @Param('vehiculoId', ParseIntPipe) vehiculoId: number,
    @Request() req,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) paginationQuery: PaginationQueryDto,
  ) {
    const userId = req.user.userId;
    return this.fuelService.getVehicleFuelHistory(vehiculoId, userId, paginationQuery);
  }
}
