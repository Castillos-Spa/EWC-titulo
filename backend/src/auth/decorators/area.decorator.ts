import { SetMetadata } from '@nestjs/common';

export const AREAS_KEY = 'areas';
export const Area = (...areas: string[]) => SetMetadata(AREAS_KEY, areas);
