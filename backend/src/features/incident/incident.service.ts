import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';

@Injectable()
export class IncidentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createIncidentDto: CreateIncidentDto) {
    // Ajustar los campos según el schema y DTO
    // Mapear los campos del DTO a los del modelo Prisma
    return this.prisma.incident.create({
      data: {
        title: createIncidentDto.Area, // Usamos Area como título (ajustar si corresponde)
        description: createIncidentDto.Descripcion,
        area: createIncidentDto.Area,
        type: createIncidentDto.Tipo as any, // Debe ser un valor válido de IncidentType
        severity: (createIncidentDto.Severidad?.toUpperCase() as any) ?? 'MEDIUM', // Ajustar mapping si es necesario
        status: 'REPORTED',
        // Keep Direccion (string) and also store latitude/longitude separately inside location JSON
        location: {
          ...(createIncidentDto.Direccion ? { direccion: createIncidentDto.Direccion } : {}),
          ...(typeof createIncidentDto.Latitude === 'number' ? { latitude: createIncidentDto.Latitude } : {}),
          ...(typeof createIncidentDto.Longitude === 'number' ? { longitude: createIncidentDto.Longitude } : {}),
        },
        photos: [],
        reportedById: 1, // Ajustar: se debe obtener del usuario autenticado
        reportedAt: createIncidentDto.Fecha ? new Date(createIncidentDto.Fecha) : new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async findAll(opts?: { page: number; pageSize: number }) {
    opts ??= { page: 1, pageSize: 20 };
    const { page, pageSize } = opts;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.incident.findMany({
        skip,
        take: pageSize,
        orderBy: { reportedAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          area: true,
          type: true,
          severity: true,
          status: true,
          reportedAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.incident.count(),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(id: number) {
    const incident = await this.prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async update(id: number, updateIncidentDto: UpdateIncidentDto) {
    await this.findOne(id); // throws if not found
    return this.prisma.incident.update({
      where: { id },
      data: {
        // Map DTO fields (which may be PascalCase from the client) to Prisma model fields
        ...((updateIncidentDto as any).Title ? { title: (updateIncidentDto as any).Title } : {}),
        ...((updateIncidentDto as any).Descripcion ? { description: (updateIncidentDto as any).Descripcion } : {}),
        ...((updateIncidentDto as any).Area ? { area: (updateIncidentDto as any).Area } : {}),
        ...((updateIncidentDto as any).Tipo ? { type: (updateIncidentDto as any).Tipo } : {}),
        ...((updateIncidentDto as any).Severidad
          ? { severity: (updateIncidentDto as any).Severidad?.toUpperCase() }
          : {}),
        ...((updateIncidentDto as any).Status ? { status: (updateIncidentDto as any).Status } : {}),
        // Update location JSON merging existing fields
        ...((updateIncidentDto as any).Direccion ||
        (updateIncidentDto as any).Latitude ||
        (updateIncidentDto as any).Longitude
          ? {
              location: {
                ...((updateIncidentDto as any).Direccion ? { direccion: (updateIncidentDto as any).Direccion } : {}),
                ...(typeof (updateIncidentDto as any).Latitude === 'number'
                  ? { latitude: (updateIncidentDto as any).Latitude }
                  : {}),
                ...(typeof (updateIncidentDto as any).Longitude === 'number'
                  ? { longitude: (updateIncidentDto as any).Longitude }
                  : {}),
              },
            }
          : {}),
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // throws if not found
    return this.prisma.incident.delete({ where: { id } });
  }
}
