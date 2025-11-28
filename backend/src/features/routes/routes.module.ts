import { Module, forwardRef } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { RoutesController } from './routes.controller';
import { NotificationModule } from '@/features/notification/notification.module';

@Module({
  imports: [forwardRef(() => NotificationModule)],
  controllers: [RoutesController],
  providers: [RoutesService],
})
export class RoutesModule {}
