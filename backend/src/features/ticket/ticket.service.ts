import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
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
} from '@prisma/client';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ticketInclude } from 'prisma/prisma-includes';
import { PrismaService } from 'prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { ApproveStepDto } from './dto/approve-step.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Area as AreaEnum } from '@/app/shared/enums/area.enum';
import { StorageService } from '@/app/storage/storage.service';
import type { Express } from 'express';

export interface TicketAttachmentsResponse {
  id: number;
  attachments: string[];
}

@Injectable()
export class TicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly storage: StorageService,
  ) {}
  private readonly logger = new Logger(TicketService.name);
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
    const { recipientArea, recipientRole, tags, category, ...restOfDto } = createTicketDto;

    // Convertir la categoría de string a enum
    const categoryEnum = category.replace(/ /g, '_') as TicketCategory;
    // Convertir el array de strings de área al enum Area
    const recipientAreaEnum = recipientArea?.map(areaStr => areaStr as Area) ?? [];

    let newTicket: Ticket;

    try {
      newTicket = await this.prisma.ticket.create({
        data: {
          ...restOfDto,
          category: categoryEnum,
          recipientArea: recipientAreaEnum, // Usamos el array de enums
          tags: tags ?? [],
          createdById,
          recipientRole: recipientRole ?? [], // Initialize recipientRole as an empty array if not provided
        },
      });
    } catch (error) {
      // Log detailed info for debugging enum/value issues
      // eslint-disable-next-line no-console
      const errorDetails =
        typeof error === 'object' && error && 'code' in error
          ? {
              code: (error as { code?: unknown }).code,
              meta: (error as { meta?: unknown }).meta,
              message: (error as Error).message,
            }
          : error;

      console.error('TicketService.create prisma.ticket.create failed', {
        payload: {
          ...restOfDto,
          category: categoryEnum,
          recipientArea: recipientAreaEnum,
          tags,
          createdById,
          recipientRole,
        },
        error: errorDetails,
      });
      throw error;
    }

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
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: ticketInclude,
    });
    if (!ticket) {
      return ticket;
    }
    return this.withSignedAttachments(ticket);
  }

  async update(id: number, updateTicketDto: UpdateTicketDto, updatedById: number) {
    const ticketBeforeUpdate = await this.prisma.ticket.findUnique({
      where: { id },
      include: { approvals: true, ordenTrabajo: true }, // Incluimos la OT para acceder a sus datos
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
        this.eventEmitter.emit('ticket.statusChanged', { ticket: ticketBeforeUpdate, newStatus: status, updatedById });
      }
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: dataToUpdate,
    });

    // --- LÓGICA POST-ACTUALIZACIÓN ---
    // Si el ticket de mantenimiento se cierra, actualizamos la OT y el vehículo.
    if (
      (updatedTicket.status === TicketStatus.Cerrado || updatedTicket.status === TicketStatus.Resuelto) &&
      ticketBeforeUpdate.category === TicketCategory.Mantenimiento &&
      ticketBeforeUpdate.ordenTrabajo // Verificamos que la OT exista
    ) {
      // Cambiamos el estado de la OT a 'completado' directamente desde aquí
      await this.prisma.ordenTrabajo.update({
        where: { id: ticketBeforeUpdate.ordenTrabajo.id },
        data: { estado: 'completado' },
      });

      // Cambiamos el estado del vehículo a 'disponible' directamente
      await this.prisma.vehiculo.update({
        where: { id: ticketBeforeUpdate.ordenTrabajo.vehiculoId },
        data: { estado: VehiculoStatus.disponible },
      });
    }

    // Notificación por cambio de asignación
    if (updateTicketDto.assignedToId && updateTicketDto.assignedToId !== ticketBeforeUpdate.assignedToId) {
      this.eventEmitter.emit('ticket.assigned', {
        ticket: updatedTicket,
        assignedToId: updateTicketDto.assignedToId,
        createdById: updatedById,
      });
    }

    this.eventEmitter.emit('ticket.updated', {
      ticket: updatedTicket,
      updatedById,
    });

    // Volver a buscar el ticket actualizado con todas las relaciones para devolverlo al frontend
    const result = await this.prisma.ticket.findUnique({
      where: { id },
      include: ticketInclude,
    });
    if (!result) {
      throw new NotFoundException(`Ticket con ID #${id} no encontrado tras la actualización`);
    }
    return this.withSignedAttachments(result);
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

    return this.withSignedAttachments(updatedTicket);
  }

  async remove(id: number) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket con ID #${id} no encontrado`);
    }
    return this.prisma.ticket.delete({ where: { id } });
  }

  async addAttachments(id: number, files: Express.Multer.File[]): Promise<TicketAttachmentsResponse> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se recibieron archivos para adjuntar.');
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket con ID #${id} no encontrado`);
    }

    const stored = await this.storage.uploadFiles(files, {
      folder: `tickets/${id}`,
    });

    const urls = stored.map(file => file.url);

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        attachmentUrls: {
          push: urls,
        },
      },
      select: { id: true, attachmentUrls: true },
    });

    this.eventEmitter.emit('ticket.attachments.uploaded', {
      ticketId: updated.id,
      urls,
    });

    const signedAttachments = await this.storage.getSignedUrls(updated.attachmentUrls ?? []);

    return {
      id: updated.id,
      attachments: signedAttachments,
    };
  }

  private async withSignedAttachments<T extends { attachmentUrls?: string[] | null }>(ticket: T): Promise<T> {
    if (!ticket?.attachmentUrls?.length) {
      return ticket;
    }

    const signedUrls = await Promise.all(
      ticket.attachmentUrls.map(async url => {
        try {
          return await this.storage.getSignedUrl(url);
        } catch (error) {
          const err = error as Error;
          this.logger.warn(`No se pudo firmar la URL del adjunto (${url}): ${err.message}`);
          return url;
        }
      }),
    );

    return {
      ...ticket,
      attachmentUrls: signedUrls,
    };
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
}
