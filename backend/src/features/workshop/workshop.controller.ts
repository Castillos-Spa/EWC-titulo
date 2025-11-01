import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Get,
  NotFoundException,
  Patch,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { WorkshopService } from './workshop.service';
import { CreateWorkOrderDto } from '../work-order/dto/create-work-order.dto';
import { CreateVehicleDto } from '../vehicle/dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../vehicle/dto/update-vehicle.dto';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';

@Controller('workshop')
export class WorkshopController {
  constructor(private readonly workshopService: WorkshopService) {}

  @Post('work-orders')
  createWorkOrder(@Body() createWorkOrderDto: CreateWorkOrderDto) {
    return this.workshopService.createWorkOrder(createWorkOrderDto);
  }

  @Get('work-orders')
  findAllWorkOrders(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    paginationQuery: PaginationQueryDto,
  ) {
    return this.workshopService.findAllWorkOrders(paginationQuery);
  }

  @Patch('work-orders/:id/status')
  updateWorkOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWorkOrderStatusDto: UpdateWorkOrderStatusDto,
  ) {
    return this.workshopService.updateWorkOrderStatus(id, updateWorkOrderStatusDto.status);
  }

  @Patch('work-orders/:workOrderId/close')
  closeWorkOrder(
    @Param('workOrderId', ParseIntPipe) workOrderId: number,
    @Body('checklist') checklist: string,
    @Body('result') result: string,
  ) {
    return this.workshopService.closeWorkOrder(workOrderId, checklist, result);
  }

  @Post('vehicles')
  createVehicle(@Body() createVehicleDto: CreateVehicleDto) {
    return this.workshopService.createVehicle(createVehicleDto);
  }

  @Patch('vehicles/:id')
  updateVehicle(@Param('id', ParseIntPipe) id: number, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.workshopService.updateVehicle(id, updateVehicleDto);
  }

  @Get('vehicles/:plate')
  async findVehicleByPlate(@Param('plate') plate: string) {
    const vehicle = await this.workshopService.findVehicleByPlate(plate);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with plate ${plate} not found`);
    }
    return vehicle;
  }
}
