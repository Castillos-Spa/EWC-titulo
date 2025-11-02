import { IsEnum } from 'class-validator';
import { WorkOrderStatus } from '../../work-order/work-order.service';

export class UpdateWorkOrderStatusDto {
  @IsEnum(WorkOrderStatus, { message: 'Invalid work order status.' })
  status: WorkOrderStatus;
}
