import { Module } from '@nestjs/common';
import { AuthModule } from '@/features/auth/auth.module';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationController } from './notification.controller';

@Module({
  imports: [AuthModule],
  providers: [NotificationGateway, NotificationService],
  controllers: [NotificationController],
  exports: [NotificationGateway, NotificationService],
})
export class NotificationModule {}
