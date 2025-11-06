import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateQADto } from './dto/create-qa.dto';
import { PrismaService } from 'prisma/prisma.service';
import { IQaService } from '@/features/workshop/interfaces/qa.interface';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { TenantContextService } from '@/app/core/tenant-context.service';

@Injectable()
export class QaService implements IQaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(createQADto: CreateQADto) {
    const tenantId = this.resolveTenantId();
    // Check if the work order (OT) exists
    const ordenTrabajo = await this.prisma.ordenTrabajo.findUnique({
      where: { id: createQADto.otId },
    });

    // If the OT doesn't exist, throw an error
    if (!ordenTrabajo) {
      throw new Error(`The work order with ID ${createQADto.otId} was not found.`);
    }

    // If the OT exists, proceed to create the QA record
    return this.prisma.qA.create({
      data: {
        otId: createQADto.otId,
        checklist: createQADto.checklist,
        resultado: createQADto.resultado,
        tenantId,
      },
    });
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const { page = 1, pageSize = 20 } = paginationQuery;
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.qA.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { ot: true },
      }),
      this.prisma.qA.count(),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return { items, total, page, pageSize, totalPages };
  }

  async findOne(id: number) {
    return this.prisma.qA.findUnique({
      where: { id },
      include: { ot: true },
    });
  }

  // Bloquear la liberación de un vehículo si no cumple con el QA
  async bloquearLiberacion(otId: number) {
    return this.prisma.ordenTrabajo.update({
      where: { id: otId },
      data: { estado: 'bloqueada' },
    });
  }

  async remove(id: number) {
    return this.prisma.qA.delete({
      where: { id },
    });
  }

  private resolveTenantId(): number {
    const tenantId = this.tenantContext.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant no especificado en la operación.');
    }
    return tenantId;
  }
}
