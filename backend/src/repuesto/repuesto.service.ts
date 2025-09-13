import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRepuestoDto } from './dto/create-repuesto.dto';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RepuestoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRepuestoDto: CreateRepuestoDto) {
    return this.prisma.repuesto.create({
      data: {
        nombre: createRepuestoDto.nombre,
        stock: createRepuestoDto.stock,
        costoUnitario: createRepuestoDto.costoUnitario,
        solicitudCompraId: createRepuestoDto.solicitudCompraId,
      },
    });
  }

  async findAll() {
    return this.prisma.repuesto.findMany({
      include: { solicitudCompra: true },
    });
  }

  async findOne(id: number) {
    return this.prisma.repuesto.findUnique({
      where: { id },
      include: { solicitudCompra: true },
    });
  }

  async updateStock(id: number, stock: number) {
    try {
      return await this.prisma.repuesto.update({
        where: { id },
        data: { stock },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Repuesto con ID ${id} no encontrado.`);
      }
      throw error;
    }
  }

  // Generar alerta cuando el stock es mínimo
  async generarAlertaStockMinimo(id: number, stockMinimo: number) {
    const repuesto = await this.prisma.repuesto.findUnique({ where: { id } });

    if (!repuesto) {
      throw new Error(`Repuesto con ID ${id} no encontrado`);
    }

    if (repuesto.stock <= stockMinimo) {
      console.log(`Alerta: Stock mínimo para el repuesto ${repuesto.nombre}`);
    }

    return repuesto;
  }

  async remove(id: number) {
    try {
      return await this.prisma.repuesto.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Repuesto con ID ${id} no encontrado.`);
      }
      throw error;
    }
  }
}
