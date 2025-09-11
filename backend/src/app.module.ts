import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ConfigModule } from '@nestjs/config';
import { TallerModule } from './taller/taller.module';
import { VehiculoModule } from './vehiculo/vehiculo.module';
import { OrdenTrabajoModule } from './orden-trabajo/orden-trabajo.module';
import { QaModule } from './qa/qa.module';
import { SolicitudCompraModule } from './solicitud-compra/solicitud-compra.module';
import { RepuestoModule } from './repuesto/repuesto.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    TallerModule,
    VehiculoModule,
    OrdenTrabajoModule,
    QaModule,
    SolicitudCompraModule,
    RepuestoModule,
    TicketModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
