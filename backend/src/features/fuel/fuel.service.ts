import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateFuelLogDto } from './dto/create-fuel-log.dto';
import { Role } from '@prisma/client';
import { UsersService } from '@/features/users/users.service';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';

@Injectable()
export class FuelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async createFuelLog(createFuelLogDto: CreateFuelLogDto, driverId: number) {
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
      },
    });
  }

  async getVehicleFuelHistory(vehiculoId: number, requestingUserId: number, paginationQuery: PaginationQueryDto) {
    const user = await this.usersService.findById(requestingUserId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isDriver = user.roleAssignments.some(ra => ra.role === Role.Especialista && ra.specialty === 'DRIVER');
    const isAdminOrSupervisor =
      user.roleAssignments.some(ra => ra.role === Role.Admin) ||
      user.roleAssignments.some(ra => ra.area === 'Transporte' && ra.role === Role.Supervisor);

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

    const isAdminOrSupervisor =
      user.roleAssignments.some(ra => ra.role === Role.Admin) ||
      user.roleAssignments.some(ra => ra.area === 'Transporte' && ra.role === Role.Supervisor);

    let vehicleWhereClause = {};

    // Si el usuario NO es admin o supervisor, se asume que es un conductor y solo ve su vehículo asignado.
    // Si ES admin o supervisor, el where clause queda vacío para traer TODOS los vehículos.
    // TODO: Re-evaluar la lógica de filtrado si es necesario ahora que no hay conductorId

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
}
