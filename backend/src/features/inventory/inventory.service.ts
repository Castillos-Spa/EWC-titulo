import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ListInventoryItemsDto } from './dto/list-inventory-items.dto';

interface AuthActor {
  username?: string;
  email?: string;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async listItems(filters: ListInventoryItemsDto) {
    const where: Record<string, unknown> = {};
    const { search, categoria, estado } = filters;

    if (search && search.trim().length > 0) {
      const term = search.trim();
      where.OR = [
        { nombre: { contains: term, mode: 'insensitive' } },
        { sku: { contains: term, mode: 'insensitive' } },
        { categoria: { contains: term, mode: 'insensitive' } },
        { ubicacion: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (categoria) {
      where.categoria = { equals: categoria, mode: 'insensitive' };
    }

    if (estado && estado !== 'all') {
      const allowedStates: InventoryItemStatusLiteral[] = ['ACTIVO', 'INACTIVO'];
      if (!allowedStates.includes(estado as InventoryItemStatusLiteral)) {
        throw new BadRequestException('Estado de inventario no soportado');
      }
      where.estado = estado;
    }

    const prisma = this.prisma as unknown as PrismaInventoryClient;
    return prisma.inventoryItem.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });
  }

  async getItem(id: number) {
    return this.findItemOrThrow(id);
  }

  async createItem(dto: CreateInventoryItemDto, actor?: AuthActor) {
    const { stockInicial, stockMinimo, ...rest } = dto;
    const prisma = this.prisma as unknown as PrismaInventoryClient;
    return prisma.$transaction(async rawTx => {
      const tx = rawTx as PrismaInventoryClient;
      const item = await tx.inventoryItem.create({
        data: {
          ...rest,
          stockMinimo,
          stockActual: stockInicial,
        },
      });

      if (stockInicial > 0) {
        await tx.inventoryMovement.create({
          data: {
            itemId: item.id,
            tipo: 'INGRESO',
            cantidad: stockInicial,
            motivo: 'Stock inicial',
            usuario: this.resolveActor(actor),
            saldoAnterior: 0,
            saldoPosterior: stockInicial,
          },
        });
      }

      return item;
    });
  }

  async updateItem(id: number, dto: UpdateInventoryItemDto) {
    await this.findItemOrThrow(id);
    const { stockInicial: _omit, ...rest } = dto;
    const prisma = this.prisma as unknown as PrismaInventoryClient;
    return prisma.inventoryItem.update({
      where: { id },
      data: rest,
    });
  }

  async adjustStock(id: number, dto: AdjustStockDto, actor?: AuthActor) {
    const item = await this.findItemOrThrow(id);
    const cantidad = dto.cantidad;
    const motivo = dto.motivo?.trim() || 'Ajuste manual';
    const saldoAnterior = item.stockActual;
    const saldoPosterior = saldoAnterior + cantidad;

    if (saldoPosterior < 0) {
      throw new BadRequestException('El ajuste dejaría el stock en negativo');
    }

    const tipo: InventoryMovementTypeLiteral = cantidad > 0 ? 'INGRESO' : 'EGRESO';

    const prisma = this.prisma as unknown as PrismaInventoryClient;
    return prisma.$transaction(async rawTx => {
      const tx = rawTx as PrismaInventoryClient;
      await tx.inventoryMovement.create({
        data: {
          itemId: id,
          tipo,
          cantidad: Math.abs(cantidad),
          motivo,
          usuario: this.resolveActor(actor),
          saldoAnterior,
          saldoPosterior,
        },
      });

      return tx.inventoryItem.update({
        where: { id },
        data: {
          stockActual: saldoPosterior,
        },
      });
    });
  }

  async listMovements(itemId: number) {
    await this.findItemOrThrow(itemId);
    const prisma = this.prisma as unknown as PrismaInventoryClient;
    return prisma.inventoryMovement.findMany({
      where: { itemId },
      orderBy: { fecha: 'desc' },
    });
  }

  async deactivateItem(id: number) {
    await this.findItemOrThrow(id);
    const prisma = this.prisma as unknown as PrismaInventoryClient;
    return prisma.inventoryItem.update({
      where: { id },
      data: {
        estado: 'INACTIVO',
      },
    });
  }

  private async findItemOrThrow(id: number) {
    const prisma = this.prisma as unknown as PrismaInventoryClient;
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Artículo de inventario no encontrado');
    }
    return item;
  }

  private resolveActor(actor?: AuthActor): string {
    if (!actor) return 'sistema';
    if (actor.username && actor.username.trim().length > 0) {
      return actor.username;
    }
    if (actor.email && actor.email.trim().length > 0) {
      return actor.email;
    }
    return 'sistema';
  }
}

type InventoryItemStatusLiteral = 'ACTIVO' | 'INACTIVO';
type InventoryMovementTypeLiteral = 'INGRESO' | 'EGRESO' | 'AJUSTE';

type PrismaInventoryClient = PrismaService & {
  inventoryItem: {
    findMany: (args?: Record<string, unknown>) => Promise<any[]>;
    findUnique: (args: Record<string, unknown>) => Promise<any | null>;
    create: (args: Record<string, unknown>) => Promise<any>;
    update: (args: Record<string, unknown>) => Promise<any>;
  };
  inventoryMovement: {
    create: (args: Record<string, unknown>) => Promise<any>;
    findMany: (args: Record<string, unknown>) => Promise<any[]>;
  };
  $transaction: <T>(fn: (tx: PrismaInventoryClient) => Promise<T>) => Promise<T>;
};
