import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'prisma/prisma.service';
import { AREAS_KEY } from '../decorators/area.decorator';

@Injectable()
export class AreaGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredAreas = this.reflector.getAllAndOverride<string[]>(AREAS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredAreas) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    const userAssignments = await this.prisma.userRoleAssignment.findMany({
      where: { userId: user.sub },
      select: { area: true },
    });

    return userAssignments.some(assignment => requiredAreas.includes(assignment.area));
  }
}
