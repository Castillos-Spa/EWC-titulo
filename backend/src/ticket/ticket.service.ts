import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Role, Ticket, TicketCategory, TicketStatus, Prisma, ApprovalStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificacionService } from '../notificacion/notificacion.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ApproveStepDto } from './dto/approve-step.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificacionService,
  ) {}

  // Define los flujos de aprobación por área
  private getApprovalWorkflow(area: string): { step: number; approverRole: Role; approverArea: string }[] {
    const workflows: Record<string, { step: number; approverRole: Role; approverArea: string }[]> = {
      Transporte: [
        { step: 1, approverRole: Role.Supervisor, approverArea: 'Transporte' },
        { step: 2, approverRole: Role.Jefe, approverArea: 'Transporte' },
        { step: 3, approverRole: Role.Jefe, approverArea: 'Finanza' },
      ],
      Obras: [
        { step: 1, approverRole: Role.Supervisor, approverArea: 'Obras' },
        { step: 2, approverRole: Role.Jefe, approverArea: 'Obras' },
        { step: 3, approverRole: Role.Jefe, approverArea: 'Finanza' },
      ],
      // ... puedes agregar más flujos para otras áreas aquí
    };
    return workflows[area] || [];
  }
  async create(createTicketDto: CreateTicketDto, createdById: number): Promise<Ticket> {
    const { recipientArea, recipientRole, tags, category, ...restOfDto } = createTicketDto;

    // Convertir la categoría de string a enum
    const categoryEnum = category.replace(/ /g, '_') as TicketCategory;

    const ticket = await this.prisma.ticket.create({
      data: {
        ...restOfDto,
        category: categoryEnum,
        recipientArea: recipientArea ?? [], // Si es null/undefined, usa un array vacío
        tags: tags ?? [],
        createdById,
        recipientRole: recipientRole ?? [], // Initialize recipientRole as an empty array if not provided
      },
    });

    const creator = await this.prisma.user.findUnique({
      where: { id: createdById },
      include: { roleAssignments: { where: { isActive: true } } },
    });

    // --- LÓGICA DE FLUJO DE APROBACIÓN ---
    if (ticket.category === TicketCategory.Solicitud_Suministro) {
      const creatorPrimaryArea = creator?.roleAssignments[0]?.area;
      if (creatorPrimaryArea) {
        const workflow = this.getApprovalWorkflow(creatorPrimaryArea);
        if (workflow.length > 0) {
          await this.prisma.ticketApproval.createMany({
            data: workflow.map(step => ({
              ticketId: ticket.id,
              step: step.step,
              approverRole: step.approverRole,
              approverArea: step.approverArea,
            })),
          });

          // Notificar al primer aprobador del flujo
          const firstStep = workflow.find(step => step.step === 1);
          if (firstStep) {
            await this.notificationService.createNotification({
              title: 'Aprobación Requerida',
              message: `La nueva solicitud de suministro "${ticket.title}" requiere tu aprobación.`,
              type: 'approval_required',
              createdById: createdById,
              areas: [firstStep.approverArea],
              roles: [firstStep.approverRole],
            });
          }
        }
      }
    }

    // Notificación al área de destino y al área del creador.
    const creatorAreas = creator?.roleAssignments.map(ra => ra.area) || [];
    const recipientAreasArray = recipientArea ?? [];

    // Usamos un Set para evitar duplicados si el creador pertenece al área de destino.
    const areasToNotify = new Set<string>([...creatorAreas, ...recipientAreasArray]);

    // Solo notificar si hay áreas de destino (para no notificar a todos en una solicitud de suministro)
    if (recipientAreasArray && recipientAreasArray.length > 0) {
      await this.notificationService.createNotification({
        title: 'Nuevo Ticket Creado',
        message: `Se ha creado un nuevo ticket: "${ticket.title}" para el área de ${recipientAreasArray.join(', ')}`,
        type: 'ticket_created',
        createdById: createdById,
        areas: Array.from(areasToNotify), // Notify by areas
        roles: recipientRole ?? [], // Also notify by recipient roles if specified
      });
    }

    // Notificación si se asigna a alguien directamente.
    if (createTicketDto.assignedToId) {
      await this.notificationService.createNotification({
        title: 'Ticket Asignado',
        message: `Se te ha asignado el ticket: "${ticket.title}".`,
        type: 'ticket_assigned',
        createdById: createdById,
        userId: createTicketDto.assignedToId,
      });
    }

    return ticket;
  }

  findAll() {
    return this.prisma.ticket.findMany({
      include: {
        createdBy: {
          select: { id: true, username: true, email: true },
        },
        assignedTo: {
          select: { id: true, username: true, email: true },
        },
        approvals: true, // Incluir los pasos de aprobación
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, username: true, email: true },
        },
        assignedTo: {
          select: { id: true, username: true, email: true },
        },
        approvals: { orderBy: { step: 'asc' } }, // Incluir y ordenar los pasos
      },
    });
  }

  async update(id: number, updateTicketDto: UpdateTicketDto, updatedById: number) {
    const ticketBeforeUpdate = await this.prisma.ticket.findUnique({
      where: { id },
      include: { approvals: true },
    });

    if (!ticketBeforeUpdate) {
      throw new NotFoundException(`Ticket con ID #${id} no encontrado`);
    }

    // Desestructuramos 'status' junto con las otras propiedades
    const {
      recipientArea,
      assignedToId,
      category,
      status,
      assignedUserConfirmation,
      requestingUserConfirmation,
      ...restOfUpdateDto
    } = updateTicketDto;

    const dataToUpdate: any = {
      ...restOfUpdateDto,
    };

    if (assignedToId !== undefined) dataToUpdate.assignedToId = assignedToId;

    if (category) {
      dataToUpdate.category = category.replace(/ /g, '_') as TicketCategory;
    }

    // Lógica de confirmación y cambio de estado automático
    if (assignedUserConfirmation === true) {
      // Si el ticket tiene un flujo de aprobación, no usamos esta lógica simple
      if (!ticketBeforeUpdate.approvals?.length) {
        dataToUpdate.assignedUserConfirmation = true;
        dataToUpdate.status = TicketStatus.Resuelto; // 1er check -> Resuelto
      }
    } else if (assignedUserConfirmation === false) {
      if (!ticketBeforeUpdate.approvals?.length) {
        // Si se desmarca la primera confirmación, se reabre y se resetea la segunda.
        dataToUpdate.assignedUserConfirmation = false;
        dataToUpdate.requestingUserConfirmation = false;
        dataToUpdate.status = TicketStatus.EnProgreso;
      }
    } else if (requestingUserConfirmation === true) {
      if (!ticketBeforeUpdate.approvals?.length) {
        if (ticketBeforeUpdate.assignedUserConfirmation) {
          // NOSONAR
          dataToUpdate.requestingUserConfirmation = true;
          dataToUpdate.status = TicketStatus.Cerrado; // 2do check -> Cerrado
        }
      }
    } else if (
      status &&
      ticketBeforeUpdate.category === TicketCategory.Solicitud_Suministro &&
      ticketBeforeUpdate.approvals.length > 0
    ) {
      // Para tickets de suministro con flujo, el estado se gestiona por las aprobaciones.
    } else if (status) {
      // Solo permite cambiar el estado manualmente si no hay una lógica de confirmación activa
      dataToUpdate.status = status;

      // Notificación por cambio de estado manual
      if (status !== ticketBeforeUpdate.status) {
        await this.notificationService.createNotification({
          title: 'Estado de Ticket Actualizado',
          message: `El estado del ticket #${id} "${ticketBeforeUpdate.title}" ha cambiado a ${status}.`,
          type: 'ticket_status_changed',
          createdById: updatedById,
          userId: ticketBeforeUpdate.createdById, // Notificar al creador
        });
      }
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: dataToUpdate,
    });

    // Notificación por cambio de asignación
    if (updateTicketDto.assignedToId && updateTicketDto.assignedToId !== ticketBeforeUpdate.assignedToId) {
      await this.notificationService.createNotification({
        title: 'Ticket Asignado',
        message: `Se te ha asignado el ticket: "${updatedTicket.title}".`,
        type: 'ticket_assigned',
        createdById: updatedById,
        userId: updateTicketDto.assignedToId,
      });
    }

    // Volver a buscar el ticket actualizado con todas las relaciones para devolverlo al frontend
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, username: true, email: true },
        },
        assignedTo: {
          select: { id: true, username: true, email: true },
        },
        approvals: { orderBy: { step: 'asc' } },
      },
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
      const isLastStep = approvalStep.step === allApprovals[allApprovals.length - 1].step;

      let finalTicketStatus = approvalStep.ticket.status;

      if (!approved) {
        // Si se rechaza, el ticket se cierra.
        finalTicketStatus = TicketStatus.Cerrado;
        await this.notificationService.createNotification({
          title: 'Solicitud Rechazada',
          message: `Tu solicitud de suministro "${approvalStep.ticket.title}" ha sido rechazada.`,
          type: 'ticket_rejected',
          createdById: userId,
          userId: approvalStep.ticket.createdById,
        });
      } else if (approved && isLastStep) {
        // Si se aprueba el último paso, el ticket se considera Resuelto.
        finalTicketStatus = TicketStatus.Resuelto;
        await this.notificationService.createNotification({
          title: 'Solicitud Aprobada',
          message: `Tu solicitud de suministro "${approvalStep.ticket.title}" ha sido completamente aprobada.`,
          type: 'ticket_approved',
          createdById: userId,
          userId: approvalStep.ticket.createdById,
        });
      } else if (approved && approvalStep.step === 1) {
        // Si se aprueba el PRIMER paso, el ticket pasa a En Progreso.
        finalTicketStatus = TicketStatus.EnProgreso;
        await this.notificationService.createNotification({
          title: 'Solicitud en Progreso',
          message: `Tu solicitud "${approvalStep.ticket.title}" ha pasado la primera aprobación y está en progreso.`,
          type: 'ticket_in_progress',
          createdById: userId,
          userId: approvalStep.ticket.createdById,
        });
      } else if (approved && !isLastStep) {
        // Si se aprueba un paso intermedio, notificar al siguiente aprobador.
        const nextStep = allApprovals.find(a => a.step === approvalStep.step + 1);
        if (nextStep) {
          await this.notificationService.createNotification({
            title: 'Aprobación Requerida',
            message: `La solicitud "${approvalStep.ticket.title}" requiere tu aprobación.`,
            type: 'approval_required',
            createdById: userId,
            areas: [nextStep.approverArea],
            roles: [nextStep.approverRole],
          });
        }
      }

      // Actualizar el estado del ticket principal
      return prisma.ticket.update({
        where: { id: ticketId },
        data: { status: finalTicketStatus },
        include: {
          createdBy: true,
          assignedTo: true,
          approvals: { include: { approvedBy: true }, orderBy: { step: 'asc' } },
        },
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
}
