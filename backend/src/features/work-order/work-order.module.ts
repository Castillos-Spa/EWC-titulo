import { Module } from '@nestjs/common';
import { WorkOrderService } from './work-order.service';

@Module({
  providers: [WorkOrderService],
  exports: [WorkOrderService],
})
export class WorkOrderModule {}
