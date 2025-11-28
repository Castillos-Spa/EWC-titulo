import { SetMetadata } from '@nestjs/common';
import { Permission } from '@prisma/client';
//TODO pasar a .env
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions);
