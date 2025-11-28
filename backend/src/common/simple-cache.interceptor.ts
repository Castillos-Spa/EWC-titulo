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

    if (req.method !== 'GET' || ttl <= 0) {
      return next.handle();
    }

    const userPart = req.user?.userId ? `:user:${req.user.userId}` : '';
    const key = `cache:${req.method}:${req.originalUrl}${userPart}`;

    const cached = this.cacheService.get<any>(key);
    if (cached !== undefined) {
      return of(cached);
    }

    return next.handle().pipe(
      tap(result => {
        this.cacheService.set(key, result, ttl * 1000);
      }),
    );
  }
}
