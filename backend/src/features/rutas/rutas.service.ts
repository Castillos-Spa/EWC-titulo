import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateRutaDto } from './dto/create-ruta.dto';
import { UpdateRutaDto } from './dto/update-ruta.dto';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';

@Injectable()
export class RutasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTransportRouteDto: CreateRutaDto) {
    return this.prisma.transportRoute.create({
      data: createTransportRouteDto,
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
