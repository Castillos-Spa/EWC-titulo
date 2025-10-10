import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CacheService } from './cache.service';

export const CACHE_TTL_KEY = 'cache_ttl_seconds';

@Injectable()
export class SimpleCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ttl = this.reflector.get<number>(CACHE_TTL_KEY, context.getHandler()) ?? 0;
    const req = context.switchToHttp().getRequest();
    const key = `cache:${req.method}:${req.originalUrl}`;

    const cached = this.cacheService.get<any>(key);
    if (cached !== undefined) {
      return of(cached);
    }

    return next.handle().pipe(
      tap(result => {
        if (ttl > 0) {
          this.cacheService.set(key, result, ttl * 1000);
        }
      }),
    );
  }
}
