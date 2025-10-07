import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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

  async findAll() {
    return this.prisma.incident.findMany();
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
        ...updateIncidentDto,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // throws if not found
    return this.prisma.incident.delete({ where: { id } });
  }
}
