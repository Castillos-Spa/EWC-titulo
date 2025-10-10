import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ConfigModule } from '@nestjs/config';
import { TallerModule } from './taller/taller.module';
import { TicketModule } from './ticket/ticket.module';
import { NotificacionModule } from './notificacion/notificacion.module';
import { FuelModule } from './fuel/fuel.module';
import { IncidentModule } from './incident/incident.module';
import { AseoModule } from './aseo/aseo.module';
import { CivilWorkModule } from './civil-work/civil-work.module';

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
  ],

  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
