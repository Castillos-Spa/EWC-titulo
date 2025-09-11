import { Injectable } from '@nestjs/common';
import { CreateRepuestoDto } from './dto/create-repuesto.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class RepuestoService {
  constructor(private readonly prisma: PrismaService) {}

  // Crear un repuesto
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

  // Listar todos los repuestos
  async findAll() {
    return this.prisma.repuesto.findMany({
      include: { solicitudCompra: true },
    });
  }

  // Buscar un repuesto por ID
  async findOne(id: number) {
    return this.prisma.repuesto.findUnique({
      where: { id },
      include: { solicitudCompra: true },
    });
  }

  // Actualizar stock de un repuesto
  async updateStock(id: number, stock: number) {
    return this.prisma.repuesto.update({
      where: { id },
      data: { stock },
    });
  }

  // Eliminar un repuesto
  async remove(id: number) {
    return this.prisma.repuesto.delete({
      where: { id },
    });
  }
}
