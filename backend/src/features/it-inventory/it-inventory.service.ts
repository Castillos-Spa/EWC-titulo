import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateItAssetDto } from './dto/create-it-asset.dto';
import { UpdateItAssetDto } from './dto/update-it-asset.dto';
import { ListItAssetsDto } from './dto/list-it-assets.dto';
import { ChangeItAssetStatusDto } from './dto/change-it-asset-status.dto';
import { AssignItAssetDto } from './dto/assign-it-asset.dto';
import { UnassignItAssetDto } from './dto/unassign-it-asset.dto';

interface AuthActor {
  username?: string;
  email?: string;
}

const STATUS_TO_MOVEMENT: Record<string, 'ASIGNACION' | 'REPARACION' | 'BAJA' | 'DEVOLUCION'> = {
  ASIGNADO: 'ASIGNACION',
  EN_REPARACION: 'REPARACION',
  RETIRADO: 'BAJA',
  EN_STOCK: 'DEVOLUCION',
};

@Injectable()
export class ItInventoryService {
  constructor(private readonly prisma: PrismaService) {}

  private get prismaClient(): PrismaItInventoryClient {
    return this.prisma as unknown as PrismaItInventoryClient;
  }

  async listAssets(filters: ListItAssetsDto) {
    const where: Record<string, unknown> = {};
    const { search, categoria, estado } = filters;

    if (search) {
      const term = search.trim();
      where.OR = [
        { assetTag: { contains: term, mode: 'insensitive' } },
        { serialNumber: { contains: term, mode: 'insensitive' } },
        { nombre: { contains: term, mode: 'insensitive' } },
        { ubicacion: { contains: term, mode: 'insensitive' } },
        { asignadoA: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (categoria && categoria !== 'all') {
      where.categoria = { equals: categoria, mode: 'insensitive' };
    }

    if (estado && estado !== 'all') {
      const allowed = ['EN_STOCK', 'ASIGNADO', 'EN_REPARACION', 'RETIRADO'];
      if (!allowed.includes(estado)) {
        throw new BadRequestException('Estado de activo IT no soportado');
      }
      where.estado = estado;
    }

    return this.prismaClient.iTAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAsset(id: number) {
    return this.findAssetOrThrow(id);
  }

  async createAsset(dto: CreateItAssetDto, actor?: AuthActor) {
    const detalle = dto.notas && dto.notas.trim().length > 0 ? dto.notas.trim() : 'Alta de activo';
    const estado = dto.estado ?? 'EN_STOCK';
    const fechaCompra = dto.fechaCompra ? new Date(dto.fechaCompra) : undefined;
    const garantiaHasta = dto.garantiaHasta ? new Date(dto.garantiaHasta) : undefined;

    return this.prismaClient.$transaction(async rawTx => {
      const tx = rawTx as PrismaItInventoryClient;
      const asset = await tx.iTAsset.create({
        data: {
          assetTag: dto.assetTag.trim(),
          serialNumber: dto.serialNumber?.trim(),
          nombre: dto.nombre.trim(),
          categoria: dto.categoria,
          ubicacion: dto.ubicacion.trim(),
          estado,
          asignadoA: dto.asignadoA?.trim(),
          proveedor: dto.proveedor?.trim(),
          fechaCompra,
          garantiaHasta,
          notas: dto.notas?.trim(),
        },
      });

      await tx.iTAssetMovement.create({
        data: {
          assetId: asset.id,
          tipo: 'ALTA',
          detalle,
          usuario: this.resolveActor(actor),
        },
      });

      return asset;
    });
  }

  async updateAsset(id: number, dto: UpdateItAssetDto) {
    await this.findAssetOrThrow(id);
    const fechaCompra = dto.fechaCompra ? new Date(dto.fechaCompra) : undefined;
    const garantiaHasta = dto.garantiaHasta ? new Date(dto.garantiaHasta) : undefined;
    return this.prismaClient.iTAsset.update({
      where: { id },
      data: {
        assetTag: dto.assetTag?.trim(),
        serialNumber: dto.serialNumber?.trim(),
        nombre: dto.nombre?.trim(),
        categoria: dto.categoria,
        ubicacion: dto.ubicacion?.trim(),
        estado: dto.estado,
        asignadoA: dto.asignadoA?.trim(),
        proveedor: dto.proveedor?.trim(),
        fechaCompra,
        garantiaHasta,
        notas: dto.notas?.trim(),
      },
    });
  }

  async changeStatus(id: number, dto: ChangeItAssetStatusDto, actor?: AuthActor) {
    const asset = await this.findAssetOrThrow(id);
    const tipo = STATUS_TO_MOVEMENT[dto.estado];
    const detalle = dto.detalle?.trim() || `Cambio de estado a ${dto.estado}`;

    return this.prismaClient.$transaction(async rawTx => {
      const tx = rawTx as PrismaItInventoryClient;
      const updated = await tx.iTAsset.update({
        where: { id },
        data: {
          estado: dto.estado,
          updatedAt: new Date(),
        },
      });

      await tx.iTAssetMovement.create({
        data: {
          assetId: asset.id,
          tipo,
          detalle,
          usuario: this.resolveActor(actor),
        },
      });

      return updated;
    });
  }

  async assignAsset(id: number, dto: AssignItAssetDto, actor?: AuthActor) {
    await this.findAssetOrThrow(id);
    const usuarioAsignado = dto.usuario.trim();
    const detalle = dto.detalle?.trim() || `Asignado a ${usuarioAsignado}`;

    return this.prismaClient.$transaction(async rawTx => {
      const tx = rawTx as PrismaItInventoryClient;
      const updated = await tx.iTAsset.update({
        where: { id },
        data: {
          asignadoA: usuarioAsignado,
          estado: 'ASIGNADO',
        },
      });

      await tx.iTAssetMovement.create({
        data: {
          assetId: id,
          tipo: 'ASIGNACION',
          detalle,
          usuario: this.resolveActor(actor),
        },
      });

      return updated;
    });
  }

  async unassignAsset(id: number, dto: UnassignItAssetDto, actor?: AuthActor) {
    const asset = await this.findAssetOrThrow(id);
    const previous = asset.asignadoA;
    const detalle = dto.detalle?.trim() || (previous ? `Devuelto por ${previous}` : 'Activo devuelto a stock');

    return this.prismaClient.$transaction(async rawTx => {
      const tx = rawTx as PrismaItInventoryClient;
      const updated = await tx.iTAsset.update({
        where: { id },
        data: {
          asignadoA: null,
          estado: 'EN_STOCK',
        },
      });

      await tx.iTAssetMovement.create({
        data: {
          assetId: id,
          tipo: 'DEVOLUCION',
          detalle,
          usuario: this.resolveActor(actor),
        },
      });

      return updated;
    });
  }

  async listMovements(assetId: number) {
    await this.findAssetOrThrow(assetId);
    return this.prismaClient.iTAssetMovement.findMany({
      where: { assetId },
      orderBy: { fecha: 'desc' },
    });
  }

  private async findAssetOrThrow(id: number) {
    const asset = await this.prismaClient.iTAsset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException('Activo IT no encontrado');
    }
    return asset;
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

type PrismaItInventoryClient = PrismaService & {
  iTAsset: {
    findMany: (args?: Record<string, unknown>) => Promise<any[]>;
    findUnique: (args: Record<string, unknown>) => Promise<any | null>;
    create: (args: Record<string, unknown>) => Promise<any>;
    update: (args: Record<string, unknown>) => Promise<any>;
  };
  iTAssetMovement: {
    create: (args: Record<string, unknown>) => Promise<any>;
    findMany: (args: Record<string, unknown>) => Promise<any[]>;
  };
  $transaction: <T>(fn: (tx: PrismaItInventoryClient) => Promise<T>) => Promise<T>;
};
