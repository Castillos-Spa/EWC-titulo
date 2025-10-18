import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CommonModule } from 'src/common/common.module';
import { SimpleCacheInterceptor } from 'src/common/simple-cache.interceptor';

@Module({
  imports: [CommonModule],
  controllers: [UsersController],
  providers: [UsersService, SimpleCacheInterceptor],
  exports: [UsersService],
})
export class UsersModule {}
