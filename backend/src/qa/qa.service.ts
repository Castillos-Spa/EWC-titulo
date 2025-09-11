import { Injectable } from '@nestjs/common';
import { CreateQADto } from './dto/create-qa.dto';
import { PrismaService } from 'prisma/prisma.service';
import { IQaService } from '@/taller/interfaces/qa.interface';

@Injectable()
export class QaService implements IQaService {
  constructor(private readonly prisma: PrismaService) {}

  // Crear un registro de QA
  async create(createQADto: CreateQADto) {
    return this.prisma.qA.create({
      data: {
        otId: createQADto.otId,
        checklist: createQADto.checklist,
        resultado: createQADto.resultado,
      },
    });
  }

  // Listar todos los registros de QA
  async findAll() {
    return this.prisma.qA.findMany({
      include: { ot: true },
    });
  }

  // Buscar un registro de QA por ID
  async findOne(id: number) {
    return this.prisma.qA.findUnique({
      where: { id },
      include: { ot: true },
    });
  }

  // Eliminar un registro de QA
  async remove(id: number) {
    return this.prisma.qA.delete({
      where: { id },
    });
  }
}
