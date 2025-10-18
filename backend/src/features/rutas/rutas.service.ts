import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateRutaDto } from './dto/create-ruta.dto';
import { UpdateRutaDto } from './dto/update-ruta.dto';

@Injectable()
export class RutasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTransportRouteDto: CreateRutaDto) {
    return this.prisma.transportRoute.create({
      data: createTransportRouteDto,
    });
  }

  async findAll() {
    return this.prisma.transportRoute.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAllAssignments() {
    return this.prisma.truckAssignment.findMany({
      include: {
        truck: true,
        route: true,
        driver: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async createAssignment(data: any) {
    // Nota: Deberías usar un DTO aquí para tener un tipado fuerte.
    return this.prisma.truckAssignment.create({
      data: {
        ...data,
        truckId: Number(data.truckId),
        routeId: Number(data.routeId),
        driverId: Number(data.driverId),
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
      throw new NotFoundException(`Ruta con ID #${id} no encontrada.`);
    }
    return route;
  }

  async update(id: number, updateTransportRouteDto: UpdateRutaDto) {
    await this.findOne(id); // Asegurarse de que la ruta exista
    return this.prisma.transportRoute.update({
      where: { id },
      data: updateTransportRouteDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Asegurarse de que la ruta exista
    return this.prisma.transportRoute.delete({
      where: { id },
    });
  }
}
