import { Global, Module } from '@nestjs/common';
import { NotificationModule } from '@/features/notification/notification.module';
import { PrismaModule } from 'prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TenantContextService } from './tenant-context.service';

@Global() // Hace que los providers exportados estén disponibles en toda la app sin importar el módulo
@Module({
  imports: [
    // Configura el ConfigModule para que sea global y cargue las variables .env
    EventEmitterModule.forRoot(),
    PrismaModule,
    NotificationModule,
  ],
  providers: [TenantContextService],
  exports: [
    // Exportamos los módulos para que otros módulos puedan usar sus providers
    PrismaModule,
    NotificationModule,
    TenantContextService,
  ],
})
export class CoreModule {}
