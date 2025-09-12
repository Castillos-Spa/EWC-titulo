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
        estado: 'abierta',
      },
    });
  }

  async findAll() {
    return this.prisma.ordenTrabajo.findMany({
      include: { vehiculo: true, qa: true },
    });
  }

  async findOne(id: number) {
    return this.prisma.ordenTrabajo.findUnique({
      where: { id },
      include: { vehiculo: true, qa: true },
    });
  }

  async update(id: number, updateOrdenTrabajoDto: UpdateOrdenTrabajoDto) {
    return this.prisma.ordenTrabajo.update({
      where: { id },
      data: updateOrdenTrabajoDto,
    });
  }

  // Planificar tareas para la orden de trabajo
  async planificarTareas(id: number, tareas: string[]) {
    return this.prisma.ordenTrabajo.update({
      where: { id },
      data: { tareas },
    });
  }

  // Asignar un responsable a la orden de trabajo
  async asignarResponsable(id: number, responsableId: number) {
    return this.prisma.ordenTrabajo.update({
      where: { id },
      data: { responsableId },
    });
  }

  // Cerrar una orden de trabajo y crear un registro en QA
  async cerrarOT(id: number, createQADto: CreateQADto) {
    await this.prisma.ordenTrabajo.update({
      where: { id },
      data: { estado: 'Cerrada' },
    });
    return this.prisma.qA.create({
      data: {
        otId: id,
        checklist: createQADto.checklist,
        resultado: createQADto.resultado,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.ordenTrabajo.delete({
      where: { id },
    });
  }
}
