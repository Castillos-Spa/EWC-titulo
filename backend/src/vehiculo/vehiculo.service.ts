import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { PrismaService } from 'prisma/prisma.service';

import { Prisma, Vehiculo } from '@prisma/client';

@Injectable()
export class VehiculoService {
  constructor(private readonly prisma: PrismaService) {}

  // Define un include estándar para reutilizarlo y mantener la consistencia.
  private readonly vehiculoInclude = {
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

  async create(createVehiculoDto: CreateVehiculoDto): Promise<Vehiculo> {
    // Asegurarse de que la patente esté en mayúsculas y sin espacios.
    const patente = createVehiculoDto.patente.toUpperCase().trim();

    const vehiculoExistente = await this.prisma.vehiculo.findUnique({
      where: { patente },
    });

    if (vehiculoExistente) {
      throw new NotFoundException(`El vehículo con patente ${patente} ya existe.`);
    }

    return this.prisma.vehiculo.create({
      data: {
        ...createVehiculoDto,
        patente, // Usar la patente normalizada
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.VehiculoWhereUniqueInput;
    where?: Prisma.VehiculoWhereInput;
    orderBy?: Prisma.VehiculoOrderByWithRelationInput;
  }): Promise<{ items: Vehiculo[]; total: number }> {
    const { skip, take, cursor, where, orderBy } = params;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.vehiculo.findMany({
        skip,
        take,
        cursor,
        where,
        orderBy,
        include: this.vehiculoInclude,
      }),
      this.prisma.vehiculo.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: number): Promise<Vehiculo> {
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { id },
      include: this.vehiculoInclude,
    });

    if (!vehiculo) {
      throw new NotFoundException(`Vehículo con ID #${id} no encontrado.`);
    }
    return vehiculo;
  }

  async findByPatente(patente: string): Promise<Vehiculo | null> {
    return this.prisma.vehiculo.findFirst({
      where: { patente: patente.toUpperCase().trim() },
      include: this.vehiculoInclude,
    });
  }

  async update(id: number, updateVehiculoDto: UpdateVehiculoDto): Promise<Vehiculo> {
    // Primero, verifica que el vehículo exista para lanzar un error 404 claro.
    await this.findOne(id);

    return this.prisma.vehiculo.update({
      where: { id },
      data: updateVehiculoDto,
      include: this.vehiculoInclude,
    });
  }

  async remove(id: number): Promise<Vehiculo> {
    // Borrado lógico: en lugar de borrar, se desactiva para mantener la integridad de datos.
    await this.findOne(id); // Asegura que el vehículo existe.
    return this.prisma.vehiculo.update({
      where: { id },
      data: { estado: 'inactivo' },
    });
  }

  async registrarDocumento(vehiculoId: number, tipo: string, url: string, descripcion?: string) {
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
