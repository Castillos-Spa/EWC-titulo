import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateFuelLogDto } from './dto/create-fuel-log.dto';
import { UsersService } from '@/features/users/users.service';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { TenantContextService } from '@/app/core/tenant-context.service';

@Injectable()
export class FuelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async createFuelLog(createFuelLogDto: CreateFuelLogDto, driverId: number) {
    const tenantId = this.resolveTenantId();
    const { vehiculoId, ...rest } = createFuelLogDto;

    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { id: vehiculoId },
    });

    if (!vehiculo) {
      throw new NotFoundException(`Vehículo con ID #${vehiculoId} no encontrado.`);
    }

    return this.prisma.fuelLog.create({
      data: {
        ...rest,
        date: new Date(createFuelLogDto.date),
        vehiculo: { connect: { id: vehiculoId } },
        driver: { connect: { id: driverId } },
        tenant: { connect: { id: tenantId } },
      },
    });
  }

  async getVehicleFuelHistory(vehiculoId: number, requestingUserId: number, paginationQuery: PaginationQueryDto) {
    const user = await this.usersService.findById(requestingUserId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const vehicle = await this.prisma.vehiculo.findUnique({
      where: { id: vehiculoId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehículo con ID #${vehiculoId} no encontrado.`);
    }

    const { page = 1, pageSize = 20 } = paginationQuery;
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.fuelLog.findMany({
        where: { vehiculoId },
        skip,
        take: pageSize,
        orderBy: { date: 'desc' },
        include: {
          driver: { select: { id: true, username: true } },
        },
      }),
      this.prisma.fuelLog.count({ where: { vehiculoId } }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    return { items, total, page, pageSize, totalPages };
  }

  async getFleetFuelSummary(requestingUserId: number, paginationQuery: PaginationQueryDto) {
    const user = await this.usersService.findById(requestingUserId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    let vehicleWhereClause = {};

    // Nota: ajustar la lógica de filtrado cuando se reactive la asignación de conductores.

    const { page = 1, pageSize = 20 } = paginationQuery;
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.vehiculo.findMany({
        where: vehicleWhereClause,
        skip,
        take: pageSize,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          patente: true,
          marca: true,
          modelo: true,
          estado: true,
          fuelLogs: {
            take: 10, // Limitamos los logs anidados para no sobrecargar la respuesta
            orderBy: { date: 'desc' },
            include: { driver: { select: { id: true, username: true } } },
          },
        },
      }),
      this.prisma.vehiculo.count({ where: vehicleWhereClause }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    return { items, total, page, pageSize, totalPages };
  }

  private resolveTenantId(): number {
    const tenantId = this.tenantContext.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant no especificado en la operación.');
    }
    return tenantId;
  }
}
