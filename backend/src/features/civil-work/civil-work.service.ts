import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateCivilWorkDto } from './dto/create-civil-work.dto';
import { UpdateCivilWorkDto } from './dto/update-civil-work.dto';
import { CivilWork, Prisma, CivilWorkStatus } from '@prisma/client';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TenantContextService } from '@/app/core/tenant-context.service';

@Injectable()
export class CivilWorkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly tenantContext: TenantContextService,
  ) {}

  // Define un include estándar para obtener todos los detalles de una obra.
  private readonly civilWorkInclude = {
    createdBy: { select: { id: true, username: true } },
    // responsibleStaff y materialsUsed son ahora arreglos de strings, se obtienen por defecto.
    // El campo 'tasks' ahora será un JSON, por lo que se obtiene por defecto.
  } satisfies Prisma.CivilWorkInclude;

  async create(createDto: CreateCivilWorkDto, createdById: number): Promise<CivilWork> {
    const tenantId = this.resolveTenantId();
    const { responsibleStaffUsernames, materialsUsed, tasks, ...workData } = createDto;

    // Convertimos el array de strings de tareas a un array de objetos con estado 'completed: false'
    const tasksAsObjects = (tasks || []).map(taskName => ({
      name: taskName,
      completed: false,
    }));

    const newCivilWork = await this.prisma.civilWork.create({
      data: {
        ...workData,
        createdBy: { connect: { id: createdById } },
        tenant: { connect: { id: tenantId } },
        tasks: tasksAsObjects as any,
        responsibleStaffUsernames: responsibleStaffUsernames, // Guardamos directamente el array de strings
        materialsUsed: materialsUsed, // Guardamos directamente el array de strings
      },
      include: this.civilWorkInclude,
    });

    this.eventEmitter.emit('civilwork.created', newCivilWork);
    return newCivilWork;
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const { page = 1, pageSize = 20 } = paginationQuery;
    const skip = (page - 1) * pageSize;

    // Usamos $transaction para ejecutar ambas consultas (conteo y obtención) en paralelo.
    const [total, items] = await this.prisma.$transaction([
      this.prisma.civilWork.count(),
      this.prisma.civilWork.findMany({
        skip,
        take: pageSize,
        orderBy: { startDate: 'desc' },
        // Optimizamos la consulta seleccionando solo los campos necesarios para la vista de lista.
        select: {
          id: true,
          project: true,
          location: true,
          startDate: true,
          estimatedEndDate: true,
          workType: true,
          status: true,
          progress: true,
          responsibleStaffUsernames: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return { items, total, page, pageSize, totalPages };
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

  async updateTasks(id: number, tasks: { name: string; completed: boolean }[]): Promise<CivilWork> {
    if (!Array.isArray(tasks)) {
      throw new BadRequestException('El campo de tareas debe ser un arreglo.');
    }

    // Calcular el nuevo progreso
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Determinar el nuevo estado basado en el progreso
    let status: CivilWorkStatus;
    let actualEndDate: Date | null = null;

    if (progress === 100) {
      status = CivilWorkStatus.COMPLETED;
      actualEndDate = new Date(); // Establece la fecha de término real al completar
    } else if (progress > 0) {
      status = CivilWorkStatus.IN_PROGRESS;
    } else {
      const currentWork = await this.findOne(id);
      status = currentWork.status;
    }

    return this.prisma.civilWork.update({
      where: { id },
      data: {
        tasks: tasks as any, // Prisma espera un JsonValue
        progress,
        status,
        ...(actualEndDate && { actualEndDate }), // Actualiza solo si se completó
      },
      include: this.civilWorkInclude,
    });
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

      const { responsibleStaffUsernames, materialsUsed, tasks, ...workData } = updateDto;

      const updatedCivilWork = await tx.civilWork.update({
        where: { id },
        data: {
          ...workData,
          tasks: tasks as any,
          // Si se proveen nombres de responsables, actualizamos el arreglo de strings.
          responsibleStaffUsernames: responsibleStaffUsernames,
          materialsUsed: materialsUsed,
        },
        include: this.civilWorkInclude,
      });

      this.eventEmitter.emit('civilwork.updated', updatedCivilWork);
      return updatedCivilWork;
    });
  }

  async remove(id: number): Promise<CivilWork> {
    // Verificamos que la obra exista para lanzar un error 404 claro.
    await this.findOne(id);

    return this.prisma.civilWork.delete({
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
