import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import {
  ThrottlerGuard,
  ThrottlerModule,
  getOptionsToken,
  getStorageToken,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { AuthModule } from '@/features/auth/auth.module';
import { UsersModule } from '@/features/users/users.module';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';
import { TenantModuleGuard } from '@/features/auth/guards/tenant-module.guard';
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
import { DashboardModule } from '@/features/dashboard/dashboard.module';
import { TenantContextMiddleware } from './core/tenant-context.middleware';

@Module({
  imports: [
    // Configura el ConfigModule para que sea global y cargue las variables .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 100,
      },
    ]),
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
    DashboardModule,
    CoreModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useFactory: (options: ThrottlerModuleOptions, storage: ThrottlerStorage) =>
        new ThrottlerGuard(options, storage, new Reflector()),
      inject: [getOptionsToken(), getStorageToken()],
    },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantModuleGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
