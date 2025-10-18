import { Global, Module } from '@nestjs/common';
import { NotificacionModule } from '@/features/notificacion/notificacion.module';
import { PrismaModule } from 'prisma/prisma.module';
import { ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Global() // Hace que los providers exportados estén disponibles en toda la app sin importar el módulo
@Module({
  imports: [
    // Configura el ConfigModule para que sea global y cargue las variables .env
    EventEmitterModule.forRoot(),
    PrismaModule,
    NotificacionModule,
  ],
  exports: [
    // Exportamos los módulos para que otros módulos puedan usar sus providers
    PrismaModule,
    NotificacionModule,
  ],
})
export class CoreModule {
  constructor(private configService: ConfigService) {
    const dbUrl = this.configService.get<string>('DATABASE_URL');
    console.log('--- Verificando DATABASE_URL en CoreModule ---');
    console.log(`DATABASE_URL: ${dbUrl ? 'Cargada correctamente' : 'NO encontrada'}`);
  }
}
