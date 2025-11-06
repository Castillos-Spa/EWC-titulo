import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { PrismaService } from 'prisma/prisma.service';

import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { Prisma, Vehiculo } from '@prisma/client';

@Injectable()
export class VehicleService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly vehicleInclude = {
    documentos: true,
    fuelLogs: {
      orderBy: { date: 'desc' },
      take: 20, // Limita los logs para no sobrecargar la respuesta
      include: { driver: { select: { id: true, username: true } } },
    },
    ordenes: {
      orderBy: { createdAt: 'desc' },
      take: 10, // Limita las órdenes de trabajo
    },
  } satisfies Prisma.VehiculoInclude;

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehiculo> {
    const { patente, tipo, ...restDto } = createVehicleDto;
    const normalizedPatente = patente.toUpperCase().trim();
    const normalizedTipo = tipo?.trim() || null;

    const existing = await this.prisma.vehiculo.findUnique({
      where: { patente: normalizedPatente },
    });

    if (existing) {
      throw new ConflictException(`Vehicle with plate ${normalizedPatente} already exists.`);
    }

    return this.prisma.vehiculo.create({
      data: {
        ...restDto,
        tipo: normalizedTipo,
        patente: normalizedPatente,
      },
    });
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const { page = 1, pageSize = 20 } = paginationQuery;
    const skip = (page - 1) * pageSize;

    // Puedes añadir filtros aquí si es necesario, por ahora el `where` está vacío.
    const where: Prisma.VehiculoWhereInput = {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.vehiculo.findMany({
        skip,
        take: pageSize,
        where,
        orderBy: { id: 'desc' },
        include: this.vehicleInclude,
      }),
      this.prisma.vehiculo.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    return { items, total, page, pageSize, totalPages };
  }

  async findOne(id: number): Promise<Vehiculo> {
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { id },
      include: this.vehicleInclude,
    });

    if (!vehiculo) {
      throw new NotFoundException(`Vehicle with ID #${id} not found.`);
    }
    return vehiculo;
  }

  async findByPlate(patente: string): Promise<Vehiculo | null> {
    return this.prisma.vehiculo.findFirst({
      where: { patente: patente.toUpperCase().trim() },
      include: this.vehicleInclude,
    });
  }

  async update(id: number, updateVehicleDto: UpdateVehicleDto): Promise<Vehiculo> {
    await this.findOne(id);

    const { tipo, ...restDto } = updateVehicleDto;
    let normalizedTipo: string | null | undefined;
    if (tipo === undefined) {
      normalizedTipo = undefined;
    } else {
      normalizedTipo = tipo?.trim() || null;
    }
    const data: Prisma.VehiculoUpdateInput = {
      ...restDto,
    };
    if (normalizedTipo !== undefined) {
      data.tipo = normalizedTipo;
    }

    return this.prisma.vehiculo.update({
      where: { id },
      data,
      include: this.vehicleInclude,
    });
  }

  async remove(id: number): Promise<Vehiculo> {
    await this.findOne(id);
    return this.prisma.vehiculo.update({
      where: { id },
      data: { estado: 'inactivo' },
    });
  }

  async registerDocument(vehiculoId: number, tipo: string, url: string, descripcion?: string) {
    return this.prisma.documento.create({
      data: {
        vehiculoId,
        tipo,
        url,
        descripcion,
      },
    });
  }
}
