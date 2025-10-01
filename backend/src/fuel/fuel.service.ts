import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateFuelLogDto } from './dto/create-fuel-log.dto';
import { Role } from '@prisma/client';
import { UsersService } from 'src/users/users.service';

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

  async getVehicleFuelHistory(vehiculoId: number, requestingUserId: number) {
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

    // Un conductor solo puede ver el historial de su vehículo asignado.
    if (isDriver && !isAdminOrSupervisor && vehicle.conductorId !== requestingUserId) {
      throw new ForbiddenException('No tienes permiso para ver el historial de este vehículo.');
    }

    return this.prisma.fuelLog.findMany({
      where: { vehiculoId },
      orderBy: { date: 'desc' },
      include: {
        driver: { select: { id: true, username: true } },
      },
    });
  }

  async getFleetFuelSummary(requestingUserId: number) {
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
    if (!isAdminOrSupervisor) {
      vehicleWhereClause = {
        conductorId: requestingUserId,
      };
    }

    const vehicles = await this.prisma.vehiculo.findMany({
      where: vehicleWhereClause,
      include: {
        fuelLogs: {
          orderBy: { date: 'desc' },
          include: {
            driver: { select: { id: true, username: true } },
          },
        },
      },
    });

    // Aquí podrías agregar lógica para calcular resúmenes si lo necesitas.
    // Por ahora, devolvemos los vehículos con su historial de combustible.
    return vehicles;
  }
}
