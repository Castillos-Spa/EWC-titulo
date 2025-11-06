import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateCleaningDto } from './dto/create-cleaning.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { UpdateCleaningDto } from './dto/update-cleaning.dto';

@Injectable()
export class CleaningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createCleaningDto: CreateCleaningDto, createdById: number) {
    const newReport = await this.prisma.aseo.create({
      data: {
        ...createCleaningDto,
        date: new Date(createCleaningDto.date),
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
    if (!r) throw new NotFoundException('Cleaning report not found');
    return r;
  }

  async update(id: number, updateCleaningDto: UpdateCleaningDto, actorId: number) {
    const { date, ...restOfDto } = updateCleaningDto;

    const dataToUpdate = {
      ...restOfDto,
      ...(date && { date: new Date(date) }),
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
