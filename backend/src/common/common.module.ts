import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { SimpleCacheInterceptor } from './simple-cache.interceptor';

@Module({
  providers: [CacheService, SimpleCacheInterceptor],
  exports: [CacheService, SimpleCacheInterceptor],
})
export class CommonModule {}
