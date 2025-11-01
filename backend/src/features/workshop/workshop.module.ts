import { Module } from '@nestjs/common';
import { WorkshopService } from './workshop.service';
import { WorkshopController } from './workshop.controller';
import { WorkOrderModule } from '@/features/work-order/work-order.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { QaModule } from '../qa/qa.module';

@Module({
  imports: [WorkOrderModule, VehicleModule, QaModule],
  controllers: [WorkshopController],
  providers: [WorkshopService],
  exports: [WorkshopService, WorkOrderModule],
})
export class WorkshopModule {}
