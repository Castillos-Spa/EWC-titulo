import { SetMetadata } from '@nestjs/common';
import { CACHE_TTL_KEY } from './simple-cache.interceptor';

export const CacheTTL = (seconds: number) => SetMetadata(CACHE_TTL_KEY, seconds);
