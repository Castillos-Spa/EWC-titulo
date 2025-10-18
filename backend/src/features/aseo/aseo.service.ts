import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateAseoDto } from './dto/create-aseo.dto';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { UpdateAseoDto } from './dto/update-aseo.dto';

@Injectable()
export class AseoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAseoDto: CreateAseoDto) {
    return this.prisma.aseo.create({
      data: {
        date: new Date(createAseoDto.date),
        area: createAseoDto.area,
        tasks: createAseoDto.tasks || [],
        responsibleStaff: createAseoDto.responsibleStaff,
        timeSpent: createAseoDto.timeSpent,
        issues: createAseoDto.issues || [],
        status: createAseoDto.status,
        observations: createAseoDto.observations || null,
      },
    });
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

  async update(id: number, updateAseoDto: UpdateAseoDto) {
    // Prisma se encarga de lanzar un error si el registro no existe,
    // por lo que la llamada a this.findOne(id) es redundante.
    const { date, ...restOfDto } = updateAseoDto;

    const dataToUpdate = {
      ...restOfDto,
      ...(date && { date: new Date(date) }), // Transforma la fecha solo si existe
    };

    // Prisma puede manejar `updatedAt` automáticamente si lo configuras en tu schema.prisma
    // model Aseo {
    //   ...
    //   updatedAt DateTime @updatedAt
    // }
    return this.prisma.aseo.update({ where: { id }, data: dataToUpdate });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.aseo.delete({ where: { id } });
  }
}
