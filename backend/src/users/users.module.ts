import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from 'prisma/prisma.module';
import { UsersController } from './users.controller';
import { NotificacionModule } from '@/notificacion/notificacion.module';
import { CommonModule } from 'src/common/common.module';
import { SimpleCacheInterceptor } from 'src/common/simple-cache.interceptor';

@Module({
  imports: [PrismaModule, NotificacionModule, CommonModule],
  controllers: [UsersController],
  providers: [UsersService, SimpleCacheInterceptor],
  exports: [UsersService],
})
export class UsersModule {}
