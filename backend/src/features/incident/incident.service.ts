import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { IncidentStatus, Prisma, type Incident } from '@prisma/client';
import { StorageService } from '@/app/storage/storage.service';
import type { Express } from 'express';

export interface IncidentPhotosResponse {
  id: number;
  photos: string[];
}

@Injectable()
export class IncidentService {
  private readonly logger = new Logger(IncidentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(createIncidentDto: CreateIncidentDto, reportedById: number) {
    const locationPayload = {
      ...(createIncidentDto.address ? { direccion: createIncidentDto.address } : {}),
      ...(typeof createIncidentDto.latitude === 'number' ? { latitude: createIncidentDto.latitude } : {}),
      ...(typeof createIncidentDto.longitude === 'number' ? { longitude: createIncidentDto.longitude } : {}),
    };

    return this.prisma.incident.create({
      data: {
        title: createIncidentDto.title,
        description: createIncidentDto.description,
        area: createIncidentDto.area,
        type: createIncidentDto.type,
        severity: createIncidentDto.severity,
        status: IncidentStatus.REPORTED,
        location: locationPayload,
        photos: [],
        reportedById,
        ...(createIncidentDto.reportedAt ? { reportedAt: new Date(createIncidentDto.reportedAt) } : {}),
      },
    });
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const { page = 1, pageSize = 20 } = paginationQuery;
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

    const totalPages = Math.ceil(total / pageSize);

    return { items, total, page, pageSize, totalPages };
  }

  async findOne(id: number) {
    const incident = await this.prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');
    return this.withSignedPhotos(incident);
  }

  async update(id: number, updateIncidentDto: UpdateIncidentDto) {
    await this.findOne(id); // throws if not found

    const data: Prisma.IncidentUpdateInput = {};

    if (updateIncidentDto.title) {
      data.title = updateIncidentDto.title;
    }
    if (updateIncidentDto.description !== undefined) {
      data.description = updateIncidentDto.description;
    }
    if (updateIncidentDto.area) {
      data.area = updateIncidentDto.area;
    }
    if (updateIncidentDto.type) {
      data.type = updateIncidentDto.type;
    }
    if (updateIncidentDto.severity) {
      data.severity = updateIncidentDto.severity;
    }
    if (updateIncidentDto.status) {
      data.status = updateIncidentDto.status;
    }

    if (
      updateIncidentDto.address !== undefined ||
      updateIncidentDto.latitude !== undefined ||
      updateIncidentDto.longitude !== undefined
    ) {
      const location: Record<string, string | number> = {};
      if (updateIncidentDto.address !== undefined) {
        location.direccion = updateIncidentDto.address;
      }
      if (updateIncidentDto.latitude !== undefined) {
        location.latitude = updateIncidentDto.latitude;
      }
      if (updateIncidentDto.longitude !== undefined) {
        location.longitude = updateIncidentDto.longitude;
      }
      data.location = location;
    }

    const updated = await this.prisma.incident.update({
      where: { id },
      data,
    });

    return this.withSignedPhotos(updated as Incident);
  }

  async remove(id: number) {
    await this.findOne(id); // throws if not found
    return this.prisma.incident.delete({ where: { id } });
  }

  async addPhotos(id: number, files: Express.Multer.File[]): Promise<IncidentPhotosResponse> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se recibieron archivos para adjuntar.');
    }

    const incident = await this.prisma.incident.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!incident) {
      throw new NotFoundException(`Incident con ID #${id} no encontrado`);
    }

    const stored = await this.storage.uploadFiles(files, {
      folder: `incidents/${id}`,
    });

    const references = stored.map(file => file.key ?? file.url);

    const updated = await this.prisma.incident.update({
      where: { id },
      data: {
        photos: {
          push: references,
        },
      },
      select: { id: true, photos: true },
    });

    const signedPhotos = await this.storage.getSignedUrls(updated.photos ?? []);

    return {
      id: updated.id,
      photos: signedPhotos,
    };
  }

  async getSignedPhotos(id: number): Promise<string[]> {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      select: { photos: true },
    });

    if (!incident) {
      throw new NotFoundException(`Incident con ID #${id} no encontrado`);
    }

    if (!incident.photos?.length) {
      return [];
    }

    return this.storage.getSignedUrls(incident.photos);
  }

  private async withSignedPhotos<T extends { photos?: string[] | null }>(incident: T): Promise<T> {
    if (!incident.photos?.length) {
      return incident;
    }

    const signedPhotos = await Promise.all(
      incident.photos.map(async photo => {
        try {
          return await this.storage.getSignedUrl(photo);
        } catch (error) {
          const err = error as Error;
          this.logger.warn(`No se pudo firmar la URL de la foto (${photo}): ${err.message}`);
          return photo;
        }
      }),
    );

    return {
      ...incident,
      photos: signedPhotos,
    };
  }
}
