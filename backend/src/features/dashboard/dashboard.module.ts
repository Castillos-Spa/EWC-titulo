import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { VehicleModule } from '../vehicle/vehicle.module';
import { WorkOrderModule } from '../work-order/work-order.module';
import { TicketModule } from '../ticket/ticket.module';
import { CleaningModule } from '../cleaning/cleaning.module';
import { CivilWorkModule } from '../civil-work/civil-work.module';
import { IncidentModule } from '../incident/incident.module';
import { NotificationModule } from '../notification/notification.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    VehicleModule,
    WorkOrderModule,
    TicketModule,
    CleaningModule,
    CivilWorkModule,
    IncidentModule,
    NotificationModule,
    UsersModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
