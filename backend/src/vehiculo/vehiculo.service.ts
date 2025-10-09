import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { PrismaService } from 'prisma/prisma.service';

import { Prisma, Vehiculo } from '@prisma/client';

@Injectable()
export class VehiculoService {
  constructor(private readonly prisma: PrismaService) {}
  //CRUD VEHICULOS
  async createVehiculos(createVehiculoDto: CreateVehiculoDto) {
    return this.prisma.vehiculo.create({
      data: createVehiculoDto,
    });
  }

  findAllVehiculos() {
    // Limitar a 50 y devolver solo campos relevantes para listados
    return this.prisma.vehiculo.findMany({
      take: 50,
      orderBy: { id: 'desc' },
      select: { id: true, patente: true, marca: true, modelo: true, estado: true, areaAsignada: true },
    });
  }

  findOneVehiculos(patente: string): Promise<Vehiculo | null> {
    return this.prisma.vehiculo.findFirst({
      where: { patente },
    });
  }

  async updateVehiculo(id: number, updateVehiculoDto: UpdateVehiculoDto) {
    try {
      return await this.prisma.vehiculo.update({
        where: { id: id },
        data: updateVehiculoDto,
      });
    } catch (error) {
      // Captura el error de Prisma si no se encuentra el registro
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Vehículo con ID ${id} no encontrado.`);
      }
      // Re-lanza cualquier otro error
      throw error;
    }
  }

  async removeVehiculo(id: number) {
    try {
      // Intenta eliminar el vehículo
      return await this.prisma.vehiculo.delete({
        where: { id: id },
      });
    } catch (error) {
      // Captura el error de Prisma si no se encuentra el registro
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Vehículo con ID ${id} no encontrado.`);
      }
      // Re-lanza cualquier otro error
      throw error;
    }
  }

  //Funciones especiales

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
