import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@/features/auth/auth.module';
import { UsersModule } from '@/features/users/users.module';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';
import { TallerModule } from '@/features/taller/taller.module';
import { TicketModule } from '@/features/ticket/ticket.module';
import { NotificacionModule } from '@/features/notificacion/notificacion.module';
import { FuelModule } from '@/features/fuel/fuel.module';
import { IncidentModule } from '@/features/incident/incident.module';
import { AseoModule } from '@/features/aseo/aseo.module';
import { CivilWorkModule } from '@/features/civil-work/civil-work.module';
import { RutasModule } from '@/features/rutas/rutas.module';
import { VehiculoModule } from '@/features/vehiculo/vehiculo.module';
import { CoreModule } from './core/core.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    TallerModule,
    TicketModule,
    NotificacionModule,
    FuelModule,
    IncidentModule,
    AseoModule,
    CivilWorkModule,
    RutasModule,
    VehiculoModule,
    CoreModule,
  ],

  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
