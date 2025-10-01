import { Controller, Get, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { FuelService } from './fuel.service';
import { CreateFuelLogDto } from './dto/create-fuel-log.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

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
  getFleetSummary(@Request() req) {
    const userId = req.user.userId;
    return this.fuelService.getFleetFuelSummary(userId);
  }

  @Get('history/:vehiculoId')
  getVehicleHistory(@Param('vehiculoId') vehiculoId: string, @Request() req) {
    const userId = req.user.userId;
    return this.fuelService.getVehicleFuelHistory(Number(vehiculoId), userId);
  }
}
