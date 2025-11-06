import { SetMetadata } from '@nestjs/common';
import { ModuleKey } from '@prisma/client';

export const REQUIRED_MODULES_KEY = 'requiredModules';

export const RequiresModules = (...modules: ModuleKey[]) => SetMetadata(REQUIRED_MODULES_KEY, modules);
