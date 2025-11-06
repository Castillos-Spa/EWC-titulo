import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Role,
  Area,
  Ticket,
  TicketCategory,
  TicketStatus,
  ApprovalStatus,
  VehiculoStatus,
  OrdenTrabajo,
  Vehiculo,
  Prisma,
} from '@prisma/client';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ticketInclude } from 'prisma/prisma-includes';
import { PrismaService } from 'prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { ApproveStepDto } from './dto/approve-step.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Area as AreaEnum } from '@/app/shared/enums/area.enum';
import { TenantContextService } from '@/app/core/tenant-context.service';

type TicketWithRelations = Prisma.TicketGetPayload<{ include: { approvals: true; ordenTrabajo: true } }>;

@Injectable()
export class TicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly tenantContext: TenantContextService,
  ) {}
  private async getApprovalWorkflow(
    area: Area,
    category: TicketCategory,
  ): Promise<{ step: number; approverRole: Role; approverArea: Area }[]> {
    const workflow = await this.prisma.approvalWorkflow.findFirst({
      where: {
        area: area,
        category: category,
      },
    });

    if (!workflow) {
      return [];
    }

    // Asumimos que 'steps' es un JSON con el formato correcto
    return workflow.steps as { step: number; approverRole: Role; approverArea: Area }[];
  }

  async create(createTicketDto: CreateTicketDto, createdById: number): Promise<Ticket> {
    const tenantId = this.resolveTenantId();
    const { recipientArea, recipientRole, tags, category, ...restOfDto } = createTicketDto;

    // Convertir la categoría de string a enum
    const categoryEnum = category.replaceAll(' ', '_') as TicketCategory;
    // Convertir el array de strings de área al enum Area
    const recipientAreaEnum = recipientArea?.map(areaStr => areaStr as Area) ?? [];

    const newTicket = await this.prisma.ticket.create({
      data: {
        ...restOfDto,
        category: categoryEnum,
        recipientArea: recipientAreaEnum, // Usamos el array de enums
        tags: tags ?? [],
        createdById,
        tenantId,
        recipientRole: recipientRole ?? [], // Initialize recipientRole as an empty array if not provided
      },
    });

    const creator = await this.prisma.user.findUnique({
      where: { id: createdById },
      include: { roleAssignments: { where: { isActive: true } } },
    });

    // --- LÓGICA DE FLUJO DE APROBACIÓN ---
    if (newTicket.category === TicketCategory.Solicitud_Suministro) {
      const creatorPrimaryArea = creator?.roleAssignments[0]?.area;
      if (creatorPrimaryArea) {
        const workflow = await this.getApprovalWorkflow(creatorPrimaryArea, newTicket.category);
        if (workflow.length > 0) {
          await this.prisma.ticketApproval.createMany({
            data: workflow.map(step => ({
              ticketId: newTicket.id,
              step: step.step,
              approverRole: step.approverRole,
              approverArea: step.approverArea,
              tenantId,
            })),
          });

          // Notificar al primer aprobador del flujo
          const firstStep = workflow.find(step => step.step === 1);
          if (firstStep) {
            this.eventEmitter.emit('approval.required', { ticket: newTicket, step: firstStep, createdById });
          }
        }
      }
    }

    // Notificación al área de destino y al área del creador.
    const creatorAreas = creator?.roleAssignments.map(ra => ra.area) || [];
    const recipientAreasArray = recipientAreaEnum; // Usamos el array ya convertido

    // Usamos un Set para evitar duplicados si el creador pertenece al área de destino.
    const areasToNotify = new Set<Area>([...creatorAreas, ...recipientAreasArray]);

    // Solo notificar si hay áreas de destino (para no notificar a todos en una solicitud de suministro)
    if (recipientAreasArray && recipientAreasArray.length > 0 && Array.isArray(recipientAreasArray)) {
      this.eventEmitter.emit('ticket.created', { ticket: newTicket, areasToNotify, recipientRole, createdById });
    }

    // Notificación si se asigna a alguien directamente.
    if (createTicketDto.assignedToId) {
      this.eventEmitter.emit('ticket.assigned', {
        ticket: newTicket,
        assignedToId: createTicketDto.assignedToId,
        createdById,
      });
    }

    return newTicket;
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const { page = 1, pageSize = 20 } = paginationQuery;
    const skip = (page - 1) * Number(pageSize);

    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        skip,
        take: pageSize,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          category: true,
          createdAt: true,
          createdBy: { select: { id: true, username: true } },
        },
      }),
      this.prisma.ticket.count(),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return { items, total, page, pageSize, totalPages };
  }

  async findOne(id: number) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: ticketInclude,
    });
  }

  async update(id: number, updateTicketDto: UpdateTicketDto, updatedById: number) {
    const ticketBeforeUpdate = await this.prisma.ticket.findUnique({
      where: { id },
      include: { approvals: true, ordenTrabajo: true }, // Incluimos la OT para acceder a sus datos
    });

    if (!ticketBeforeUpdate) {
      throw new NotFoundException(`Ticket con ID #${id} no encontrado`);
    }

    const { dataToUpdate, manualStatusChange } = this.buildTicketUpdatePlan(updateTicketDto, ticketBeforeUpdate);

    if (manualStatusChange) {
      this.eventEmitter.emit('ticket.statusChanged', {
        ticket: ticketBeforeUpdate,
        newStatus: manualStatusChange,
        updatedById,
      });
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: dataToUpdate,
    });

    await this.handleMaintenanceSideEffects(updatedTicket, ticketBeforeUpdate);

    if (this.hasAssignmentChanged(updateTicketDto.assignedToId, ticketBeforeUpdate.assignedToId)) {
      this.eventEmitter.emit('ticket.assigned', {
        ticket: updatedTicket,
        assignedToId: updateTicketDto.assignedToId as number,
        createdById: updatedById,
      });
    }

    this.eventEmitter.emit('ticket.updated', {
      ticket: updatedTicket,
      updatedById,
    });

    // Volver a buscar el ticket actualizado con todas las relaciones para devolverlo al frontend
    return this.prisma.ticket.findUnique({
      where: { id },
      include: ticketInclude,
    });
  }

  async approveStep(ticketId: number, approvalId: number, userId: number, approveStepDto: ApproveStepDto) {
    const { approved, comments } = approveStepDto;

    // 1. Validar que el usuario y el paso de aprobación existen
    const [approvalStep, user] = await Promise.all([
      this.prisma.ticketApproval.findUnique({
        where: { id: approvalId, ticketId: ticketId },
        include: { ticket: { include: { approvals: { orderBy: { step: 'asc' } } } } },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { roleAssignments: { where: { isActive: true } } },
      }),
    ]);

    if (!approvalStep) {
      throw new NotFoundException(
        `Paso de aprobación con ID #${approvalId} para el ticket #${ticketId} no encontrado.`,
      );
    }
    if (!user) {
      throw new ForbiddenException('Usuario no encontrado.');
    }
    if (approvalStep.status !== ApprovalStatus.Pendiente) {
      throw new BadRequestException('Este paso ya ha sido procesado.');
    }

    // 2. Validar permisos del usuario
    const userRoles = user.roleAssignments.map(ra => ra.role);
    const userAreas = user.roleAssignments.map(ra => ra.area);

    const canApprove = userRoles.includes(approvalStep.approverRole) && userAreas.includes(approvalStep.approverArea);

    if (!canApprove) {
      throw new ForbiddenException('No tienes permisos para aprobar este paso.');
    }

    // 3. Validar que es el turno correcto para aprobar
    const previousStep = approvalStep.ticket.approvals.find(a => a.step === approvalStep.step - 1);
    if (previousStep && previousStep.status !== ApprovalStatus.Aprobado) {
      throw new ForbiddenException('El paso de aprobación anterior aún no ha sido completado.');
    }

    // 4. Ejecutar la actualización en una transacción
    const updatedTicket = await this.prisma.$transaction(async prisma => {
      // Actualizar el paso de aprobación
      await prisma.ticketApproval.update({
        where: { id: approvalId },
        data: {
          status: approved ? ApprovalStatus.Aprobado : ApprovalStatus.Rechazado,
          approvedById: userId,
          approvedAt: new Date(),
          comments,
        },
      });

      const allApprovals = approvalStep.ticket.approvals;
      const lastStep = allApprovals.at(-1)?.step;
      const isLastStep = approvalStep.step === lastStep;

      let finalTicketStatus = approvalStep.ticket.status;

      if (!approved) {
        // Si se rechaza, el ticket se cierra.
        finalTicketStatus = TicketStatus.Cerrado;
        this.eventEmitter.emit('approval.rejected', { ticket: approvalStep.ticket, approverId: userId });
      } else if (approved && isLastStep) {
        // Si se aprueba el último paso, el ticket se considera Resuelto.
        finalTicketStatus = TicketStatus.Resuelto;
        this.eventEmitter.emit('approval.completed', { ticket: approvalStep.ticket, approverId: userId });
      } else if (approved && approvalStep.step === 1) {
        // Si se aprueba el PRIMER paso, el ticket pasa a En Progreso.
        finalTicketStatus = TicketStatus.EnProgreso;
        this.eventEmitter.emit('approval.inProgress', { ticket: approvalStep.ticket, approverId: userId });
      } else if (approved && !isLastStep) {
        // Si se aprueba un paso intermedio, notificar al siguiente aprobador.
        const nextStep = allApprovals.find(a => a.step === approvalStep.step + 1);
        if (nextStep) {
          this.eventEmitter.emit('approval.required', {
            ticket: approvalStep.ticket,
            step: nextStep,
            createdById: userId,
          });
        }
      }

      // Actualizar el estado del ticket principal
      return prisma.ticket.update({
        where: { id: ticketId },
        data: { status: finalTicketStatus },
        include: ticketInclude,
      });
    });

    return updatedTicket;
  }

  async remove(id: number) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket con ID #${id} no encontrado`);
    }
    return this.prisma.ticket.delete({ where: { id } });
  }

  // --- Event Listeners ---

  @OnEvent('orden_trabajo.pendiente_revision')
  async handleOrdenTrabajoPendienteRevision(payload: OrdenTrabajo & { vehiculo: Vehiculo }) {
    const otCreatorId = payload.responsableId;

    if (otCreatorId) {
      // Usamos el método 'create' de este mismo servicio para crear el ticket.
      await this.create(
        {
          title: `Revisión de Mantenimiento OT-${payload.id}`,
          description: `Se requiere revisión para la OT #${payload.id} en el vehículo ${payload.vehiculo.patente}. Descripción: ${payload.description}`,
          category: TicketCategory.Mantenimiento,
          // Asignamos al área de Transporte y rol de Supervisor usando el enum
          recipientArea: [AreaEnum.Transporte],
          recipientRole: [Role.Supervisor],
          ordenTrabajoId: payload.id,
        },
        otCreatorId, // El ticket es "creado" por el mecánico que finalizó el trabajo.
      );
    }
  }

  private buildTicketUpdatePlan(
    updateTicketDto: UpdateTicketDto,
    ticketBeforeUpdate: TicketWithRelations,
  ): { dataToUpdate: Record<string, unknown>; manualStatusChange?: TicketStatus } {
    const {
      recipientArea: _recipientArea,
      assignedToId,
      category,
      status,
      assignedUserConfirmation,
      requestingUserConfirmation,
      ...restOfUpdateDto
    } = updateTicketDto;

    const dataToUpdate: Record<string, unknown> = {
      ...restOfUpdateDto,
    };

    if (assignedToId !== undefined) {
      dataToUpdate.assignedToId = assignedToId;
    }

    if (category) {
      dataToUpdate.category = category.replaceAll(' ', '_') as TicketCategory;
    }

    let manualStatusChange: TicketStatus | undefined;

    const approvalsCount = ticketBeforeUpdate.approvals?.length ?? 0;

    if (assignedUserConfirmation === true && approvalsCount === 0) {
      dataToUpdate.assignedUserConfirmation = true;
      dataToUpdate.status = TicketStatus.Resuelto;
      return { dataToUpdate, manualStatusChange };
    }

    if (assignedUserConfirmation === false && approvalsCount === 0) {
      dataToUpdate.assignedUserConfirmation = false;
      dataToUpdate.requestingUserConfirmation = false;
      dataToUpdate.status = TicketStatus.EnProgreso;
      return { dataToUpdate, manualStatusChange };
    }

    const canConfirmRequestingUser =
      requestingUserConfirmation === true && approvalsCount === 0 && ticketBeforeUpdate.assignedUserConfirmation;
    if (canConfirmRequestingUser) {
      dataToUpdate.requestingUserConfirmation = true;
      dataToUpdate.status = TicketStatus.Cerrado;
      return { dataToUpdate, manualStatusChange };
    }

    const approvalsManageStatus =
      status &&
      ticketBeforeUpdate.category === TicketCategory.Solicitud_Suministro &&
      ticketBeforeUpdate.approvals.length > 0;
    if (approvalsManageStatus) {
      return { dataToUpdate, manualStatusChange };
    }

    if (status) {
      dataToUpdate.status = status;
      if (status !== ticketBeforeUpdate.status) {
        manualStatusChange = status;
      }
    }

    return { dataToUpdate, manualStatusChange };
  }

  private async handleMaintenanceSideEffects(
    updatedTicket: Ticket,
    ticketBeforeUpdate: TicketWithRelations,
  ): Promise<void> {
    if (
      (updatedTicket.status === TicketStatus.Cerrado || updatedTicket.status === TicketStatus.Resuelto) &&
      ticketBeforeUpdate.category === TicketCategory.Mantenimiento &&
      ticketBeforeUpdate.ordenTrabajo
    ) {
      await this.prisma.ordenTrabajo.update({
        where: { id: ticketBeforeUpdate.ordenTrabajo.id },
        data: { estado: 'completado' },
      });

      await this.prisma.vehiculo.update({
        where: { id: ticketBeforeUpdate.ordenTrabajo.vehiculoId },
        data: { estado: VehiculoStatus.disponible },
      });
    }
  }

  private hasAssignmentChanged(
    newAssignedId: number | undefined,
    previousAssignedId: number | null | undefined,
  ): boolean {
    return newAssignedId !== undefined && newAssignedId !== previousAssignedId;
  }

  private resolveTenantId(): number {
    const tenantId = this.tenantContext.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant no especificado en la operación.');
    }
    return tenantId;
  }
}
