import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateCivilWorkDto } from './dto/create-civil-work.dto';
import { UpdateCivilWorkDto } from './dto/update-civil-work.dto';
import { CivilWork, Prisma } from '@prisma/client';

@Injectable()
export class CivilWorkService {
  constructor(private readonly prisma: PrismaService) {}

  // Define un include estándar para obtener todos los detalles de una obra.
  private readonly civilWorkInclude = {
    createdBy: { select: { id: true, username: true } },
    // responsibleStaff y materialsUsed son ahora arreglos de strings, se obtienen por defecto.
  } satisfies Prisma.CivilWorkInclude;

  async create(createDto: CreateCivilWorkDto, createdById: number): Promise<CivilWork> {
    const { responsibleStaffUsernames, materialsUsed, ...workData } = createDto;

    return this.prisma.civilWork.create({
      data: {
        ...workData,
        createdBy: { connect: { id: createdById } },
        responsibleStaff: responsibleStaffUsernames, // Guardamos directamente el array de strings
        materialsUsed: materialsUsed, // Guardamos directamente el array de strings
      },
      include: this.civilWorkInclude,
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.CivilWorkWhereInput;
    orderBy?: Prisma.CivilWorkOrderByWithRelationInput;
  }): Promise<{ items: Partial<CivilWork>[]; total: number }> {
    const { skip, take, where, orderBy } = params;

    // Usamos $transaction para ejecutar ambas consultas (conteo y obtención) en paralelo.
    const [total, items] = await this.prisma.$transaction([
      this.prisma.civilWork.count({ where }),
      this.prisma.civilWork.findMany({
        skip,
        take,
        where,
        orderBy,
        // Optimizamos la consulta seleccionando solo los campos necesarios para la vista de lista.
        select: {
          id: true,
          project: true,
          location: true,
          date: true,
          workType: true,
          status: true,
          progress: true,
          responsibleStaff: true,
        },
      }),
    ]);

    return { items, total };
  }

  async findOne(id: number): Promise<CivilWork> {
    const civilWork = await this.prisma.civilWork.findUnique({
      where: { id },
      include: this.civilWorkInclude,
    });

    if (!civilWork) {
      throw new NotFoundException(`Obra Civil con ID #${id} no encontrada.`);
    }
    return civilWork;
  }

  async update(id: number, updateDto: UpdateCivilWorkDto): Promise<CivilWork> {
    return this.prisma.$transaction(async tx => {
      // Verificamos que la obra exista dentro de la misma transacción.
      const existingWork = await tx.civilWork.findUnique({
        where: { id },
      });

      if (!existingWork) {
        throw new NotFoundException(`Obra Civil con ID #${id} no encontrada.`);
      }

      const { responsibleStaffUsernames, materialsUsed, ...workData } = updateDto;

      return tx.civilWork.update({
        where: { id },
        data: {
          ...workData,
          // Si se proveen nombres de responsables, actualizamos el arreglo de strings.
          responsibleStaff: responsibleStaffUsernames,
          materialsUsed: materialsUsed,
        },
        include: this.civilWorkInclude,
      });
    });
  }

  async remove(id: number): Promise<CivilWork> {
    // Verificamos que la obra exista para lanzar un error 404 claro.
    await this.findOne(id);

    return this.prisma.civilWork.delete({
      where: { id },
    });
  }
}
