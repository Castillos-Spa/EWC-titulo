import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@/features/auth/auth.module';
import { UsersModule } from '@/features/users/users.module';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';
import { WorkshopModule } from '@/features/workshop/workshop.module';
import { TicketModule } from '@/features/ticket/ticket.module';
import { NotificationModule } from '@/features/notification/notification.module';
import { FuelModule } from '@/features/fuel/fuel.module';
import { IncidentModule } from '@/features/incident/incident.module';
import { CleaningModule } from '@/features/cleaning/cleaning.module';
import { CivilWorkModule } from '@/features/civil-work/civil-work.module';
import { RoutesModule } from '@/features/routes/routes.module';
import { VehicleModule } from '@/features/vehicle/vehicle.module';
import { CoreModule } from './core/core.module';

@Module({
  imports: [
    // Configura el ConfigModule para que sea global y cargue las variables .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    UsersModule,
    WorkshopModule,
    TicketModule,
    NotificationModule,
    FuelModule,
    IncidentModule,
    CleaningModule,
    CivilWorkModule,
    RoutesModule,
    VehicleModule,
    CoreModule,
  ],

  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
