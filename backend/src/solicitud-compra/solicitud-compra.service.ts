import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateSolicitudCompraDto } from './dto/create-solicitud-compra.dto';

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
    return this.prisma.solicitudCompra.delete({
      where: { id },
    });
  }
}
