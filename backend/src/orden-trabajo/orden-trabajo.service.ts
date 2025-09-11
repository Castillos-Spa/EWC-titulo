import { Injectable } from '@nestjs/common';
import { CreateOrdenTrabajoDto } from './dto/create-orden-trabajo.dto';
import { UpdateOrdenTrabajoDto } from './dto/update-orden-trabajo.dto';
import { PrismaService } from 'prisma/prisma.service';
import { CreateQADto } from '@/qa/dto/create-qa.dto';

@Injectable()
export class OrdenTrabajoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrdenTrabajoDto: CreateOrdenTrabajoDto) {
    return this.prisma.ordenTrabajo.create({
      data: {
        vehiculoId: createOrdenTrabajoDto.vehiculoId,
        tipo: createOrdenTrabajoDto.tipo,
      },
    });
  }

  async findAll() {
    return this.prisma.ordenTrabajo.findMany({
      include: { vehiculo: true, qa: true },
    });
  }

  // Buscar una orden de trabajo por ID
  async findOne(id: number) {
    return this.prisma.ordenTrabajo.findUnique({
      where: { id },
      include: { vehiculo: true, qa: true },
    });
  }

  // Actualizar el estado de una orden de trabajo
  async update(id: number, updateOrdenTrabajoDto: UpdateOrdenTrabajoDto) {
    return this.prisma.ordenTrabajo.update({
      where: { id },
      data: updateOrdenTrabajoDto,
    });
  }

  // Cerrar una orden de trabajo y crear un registro en QA
  async cerrarOT(id: number, createQADto: CreateQADto) {
    // Actualizar el estado de la OT a "Cerrada"
    await this.prisma.ordenTrabajo.update({
      where: { id },
      data: { estado: 'Cerrada' },
    });

    // Crear el registro en QA
    return this.prisma.qA.create({
      data: {
        otId: id,
        checklist: createQADto.checklist,
        resultado: createQADto.resultado,
      },
    });
  }

  // Eliminar una orden de trabajo
  async remove(id: number) {
    return this.prisma.ordenTrabajo.delete({
      where: { id },
    });
  }
}
