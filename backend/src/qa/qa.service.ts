import { Injectable } from '@nestjs/common';
import { CreateQADto } from './dto/create-qa.dto';
import { PrismaService } from 'prisma/prisma.service';
import { IQaService } from '@/taller/interfaces/qa.interface';

@Injectable()
export class QaService implements IQaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createQADto: CreateQADto) {
    return this.prisma.qA.create({
      data: {
        otId: createQADto.otId,
        checklist: createQADto.checklist,
        resultado: createQADto.resultado,
      },
    });
  }

  async findAll() {
    return this.prisma.qA.findMany({
      include: { ot: true },
    });
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
}
