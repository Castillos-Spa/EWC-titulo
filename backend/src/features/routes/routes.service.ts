import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { TenantContextService } from '@/app/core/tenant-context.service';

@Injectable()
export class RoutesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(createTransportRouteDto: CreateRouteDto) {
    const tenantId = this.resolveTenantId();
    return this.prisma.transportRoute.create({
      data: {
        ...createTransportRouteDto,
        tenantId,
      },
    });
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const { page = 1, pageSize = 20 } = paginationQuery;
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transportRoute.findMany({
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.transportRoute.count(),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    return { items, total, page, pageSize, totalPages };
  }

  async findAllAssignments(paginationQuery: PaginationQueryDto) {
    const { page = 1, pageSize = 20 } = paginationQuery;
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.truckAssignment.findMany({
        skip,
        take: pageSize,
        include: {
          truck: true,
          route: true,
          driver: true,
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.truckAssignment.count(),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    return { items, total, page, pageSize, totalPages };
  }

  async createAssignment(data: any) {
    const tenantId = this.resolveTenantId();
    return this.prisma.truckAssignment.create({
      data: {
        ...data,
        truckId: Number(data.truckId),
        routeId: Number(data.routeId),
        driverId: Number(data.driverId),
        tenantId,
      },
    });
  }

  async removeAssignment(id: number) {
    return this.prisma.truckAssignment.delete({ where: { id } });
  }

  async findOne(id: number) {
    const route = await this.prisma.transportRoute.findUnique({
      where: { id },
    });
    if (!route) {
      throw new NotFoundException(`Route with ID #${id} not found.`);
    }
    return route;
  }

  async update(id: number, updateTransportRouteDto: UpdateRouteDto) {
    await this.findOne(id);
    return this.prisma.transportRoute.update({
      where: { id },
      data: updateTransportRouteDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.transportRoute.delete({
      where: { id },
    });
  }

  private resolveTenantId(): number {
    const tenantId = this.tenantContext.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant no especificado en la operación.');
    }
    return tenantId;
  }
}
