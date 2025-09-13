import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateSolicitudCompraDto } from './dto/create-solicitud-compra.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SolicitudCompraService {
  constructor(private readonly prisma: PrismaService) {}

  // Crear una solicitud de compra
  async createSolicitudCompra(createSolicitudCompraDto: CreateSolicitudCompraDto) {
    return this.prisma.solicitudCompra.create({
      data: {
        monto: createSolicitudCompraDto.monto,
        repuestos: {
          // Incluye explícitamente el campo repuestos
          create: [], // Array vacío, ya que no se están creando repuestos en este paso
        },
      },
    });
  }

  // Listar todas las solicitudes de compra
  async findAllSolicitudCompra() {
    return this.prisma.solicitudCompra.findMany({
      include: { repuestos: true },
    });
  }

  // Buscar una solicitud de compra por ID
  async findOneSolicitudCompra(id: number) {
    return this.prisma.solicitudCompra.findUnique({
      where: { id },
      include: { repuestos: true },
    });
  }

  // Eliminar una solicitud de compra
  async removeSolicitudCompra(id: number) {
    try {
      return await this.prisma.solicitudCompra.delete({
        where: { id },
      });
    } catch (error) {
      // Captura el error de Prisma si no se encuentra el registro
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Solicitud de compra con ID ${id} no encontrada.`);
      }
      // Re-lanza cualquier otro error
      throw error;
    }
  }

  // Aprobar una solicitud de compra
  async aprobarSolicitud(id: number) {
    try {
      return await this.prisma.solicitudCompra.update({
        where: { id },
        data: { aprobada: true },
      });
    } catch (error) {
      // Captura el error de Prisma si no se encuentra el registro
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Solicitud de compra con ID ${id} no encontrada.`);
      }
      // Re-lanza cualquier otro error
      throw error;
    }
  }
}
