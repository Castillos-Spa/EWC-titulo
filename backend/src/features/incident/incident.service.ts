import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { IncidentStatus, Prisma } from '@prisma/client';
import { TenantContextService } from '@/app/core/tenant-context.service';

@Injectable()
export class IncidentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(createIncidentDto: CreateIncidentDto, reportedById: number) {
    const tenantId = this.resolveTenantId();
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
        reportedBy: { connect: { id: reportedById } },
        tenant: { connect: { id: tenantId } },
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
    return incident;
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

    return this.prisma.incident.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // throws if not found
    return this.prisma.incident.delete({ where: { id } });
  }

  private resolveTenantId(): number {
    const tenantId = this.tenantContext.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant no especificado en la operación.');
    }
    return tenantId;
  }
}
