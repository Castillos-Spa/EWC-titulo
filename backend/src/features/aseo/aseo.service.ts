import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateAseoDto } from './dto/create-aseo.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { UpdateAseoDto } from './dto/update-aseo.dto';

@Injectable()
export class AseoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createAseoDto: CreateAseoDto, createdById: number) {
    const newReport = await this.prisma.aseo.create({
      data: {
        ...createAseoDto,
        date: new Date(createAseoDto.date), // Asegurarse que la fecha es un objeto Date
        createdBy: { connect: { id: createdById } },
      },
    });

    this.eventEmitter.emit('cleaning_report.created', { report: newReport, createdById });

    return newReport;
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const { page = 1, pageSize = 20 } = paginationQuery;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.aseo.findMany({
        skip,
        take: pageSize,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          date: true,
          area: true,
          responsibleStaff: true,
          timeSpent: true,
          status: true,
        },
      }),
      this.prisma.aseo.count(),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(id: number) {
    const r = await this.prisma.aseo.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Aseo not found');
    return r;
  }

  async update(id: number, updateAseoDto: UpdateAseoDto, actorId: number) {
    const { date, ...restOfDto } = updateAseoDto;

    const dataToUpdate = {
      ...restOfDto,
      ...(date && { date: new Date(date) }), // Transforma la fecha solo si existe
    };

    const updatedReport = await this.prisma.aseo.update({
      where: { id },
      data: dataToUpdate,
    });

    this.eventEmitter.emit('cleaning_report.updated', { report: updatedReport, actorId });

    return updatedReport;
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.aseo.delete({ where: { id } });
  }
}
