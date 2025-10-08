import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAseoDto } from './dto/create-aseo.dto';
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

  async findAll(opts?: { page: number; pageSize: number }) {
    opts ??= { page: 1, pageSize: 20 };
    const { page, pageSize } = opts;
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
    await this.findOne(id);
    const data: any = {};
    if ((updateAseoDto as any).date) data.date = new Date((updateAseoDto as any).date);
    if ((updateAseoDto as any).area) data.area = (updateAseoDto as any).area;
    if ((updateAseoDto as any).tasks) data.tasks = (updateAseoDto as any).tasks;
    if ((updateAseoDto as any).responsibleStaff) data.responsibleStaff = (updateAseoDto as any).responsibleStaff;
    if ((updateAseoDto as any).timeSpent) data.timeSpent = (updateAseoDto as any).timeSpent;
    if ((updateAseoDto as any).issues) data.issues = (updateAseoDto as any).issues;
    if ((updateAseoDto as any).status) data.status = (updateAseoDto as any).status;
    if ((updateAseoDto as any).observations) data.observations = (updateAseoDto as any).observations;
    data.updatedAt = new Date();
    return this.prisma.aseo.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.aseo.delete({ where: { id } });
  }
}
