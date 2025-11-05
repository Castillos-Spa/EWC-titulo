import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Area, ApprovalStatus, Role, TicketCategory, TicketStatus, VehiculoStatus } from '@prisma/client';
import { createPrismaMock, PrismaMock } from '../../../test/utils/mock-prisma';
import { TicketService } from './ticket.service';

describe('TicketService', () => {
  let service: TicketService;
  let prisma: PrismaMock;
  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    service = new TicketService(prisma, eventEmitter);
  });

  describe('create', () => {
    it('creates supply ticket, registers workflow, and emits notifications', async () => {
      const dto = {
        title: 'New ticket',
        description: 'desc',
        category: 'Solicitud Suministro',
        recipientArea: ['Transporte'],
        recipientRole: [Role.Supervisor],
        tags: ['urgent'],
        assignedToId: 4,
      } as any;

      const createdTicket = {
        id: 10,
        category: TicketCategory.Solicitud_Suministro,
        recipientArea: [Area.Transporte],
      } as any;

      (prisma.ticket.create as jest.Mock).mockResolvedValueOnce(createdTicket);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 1,
        roleAssignments: [{ area: Area.Transporte, role: Role.Admin, isActive: true }],
      });
      (prisma.approvalWorkflow.findFirst as jest.Mock).mockResolvedValueOnce({
        steps: [{ step: 1, approverRole: Role.Supervisor, approverArea: Area.Transporte }],
      });
      (prisma.ticketApproval.createMany as jest.Mock).mockResolvedValueOnce({ count: 1 });

      const result = await service.create(dto, 1);

      expect(prisma.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: TicketCategory.Solicitud_Suministro,
            recipientArea: [Area.Transporte],
          }),
        }),
      );
      expect(prisma.ticketApproval.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [
            expect.objectContaining({
              ticketId: createdTicket.id,
              approverRole: Role.Supervisor,
              approverArea: Area.Transporte,
            }),
          ],
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'approval.required',
        expect.objectContaining({ ticket: createdTicket, createdById: 1 }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'ticket.created',
        expect.objectContaining({ ticket: createdTicket, createdById: 1 }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'ticket.assigned',
        expect.objectContaining({ ticket: createdTicket, assignedToId: 4 }),
      );
      expect(result).toBe(createdTicket);
    });
  });

  describe('update', () => {
    it('throws when ticket is missing', async () => {
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.update(1, {}, 1)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates assignment and emits notifications', async () => {
      const existingTicket = {
        id: 10,
        status: TicketStatus.EnProgreso,
        category: TicketCategory.Mantenimiento,
        assignedToId: 2,
        approvals: [],
        ordenTrabajo: null,
      } as any;
      const updatedTicket = { ...existingTicket, assignedToId: 3 };

      (prisma.ticket.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingTicket)
        .mockResolvedValueOnce(updatedTicket);
      (prisma.ticket.update as jest.Mock).mockResolvedValueOnce(updatedTicket);

      const result = await service.update(10, { assignedToId: 3 }, 7);

      expect(prisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: expect.objectContaining({ assignedToId: 3 }),
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'ticket.assigned',
        expect.objectContaining({ ticket: updatedTicket, assignedToId: 3, createdById: 7 }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'ticket.updated',
        expect.objectContaining({ ticket: updatedTicket, updatedById: 7 }),
      );
      expect(result).toEqual(updatedTicket);
    });

    it('closes maintenance ticket updating OT and vehicle state', async () => {
      const existingTicket = {
        id: 15,
        status: TicketStatus.EnProgreso,
        category: TicketCategory.Mantenimiento,
        assignedToId: 2,
        approvals: [],
        ordenTrabajo: { id: 40, vehiculoId: 9 },
      } as any;
      const updatedTicket = { ...existingTicket, status: TicketStatus.Cerrado };

      (prisma.ticket.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingTicket)
        .mockResolvedValueOnce(updatedTicket);
      (prisma.ticket.update as jest.Mock).mockResolvedValueOnce(updatedTicket);

      const result = await service.update(15, { status: TicketStatus.Cerrado }, 5);

      expect(prisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: TicketStatus.Cerrado }),
        }),
      );
      expect(prisma.ordenTrabajo.update).toHaveBeenCalledWith({
        where: { id: 40 },
        data: { estado: 'completado' },
      });
      expect(prisma.vehiculo.update).toHaveBeenCalledWith({
        where: { id: 9 },
        data: { estado: VehiculoStatus.disponible },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'ticket.statusChanged',
        expect.objectContaining({ ticket: existingTicket, newStatus: TicketStatus.Cerrado, updatedById: 5 }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'ticket.updated',
        expect.objectContaining({ ticket: updatedTicket, updatedById: 5 }),
      );
      expect(result).toEqual(updatedTicket);
    });
  });

  describe('approveStep', () => {
    const buildApproval = (overrides: Partial<any> = {}) => ({
      id: 1,
      ticketId: 10,
      step: 1,
      status: ApprovalStatus.Pendiente,
      approverRole: Role.Supervisor,
      approverArea: Area.Transporte,
      ticket: {
        id: 10,
        status: TicketStatus.Pendiente,
        approvals: [
          { id: 1, step: 1, status: ApprovalStatus.Pendiente },
          { id: 2, step: 2, status: ApprovalStatus.Pendiente },
        ],
      },
      ...overrides,
    });

    it('throws when approval step is missing', async () => {
      (prisma.ticketApproval.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, roleAssignments: [] } as any);

      await expect(service.approveStep(10, 1, 1, { approved: true })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when user lacks permissions for the step', async () => {
      const approval = buildApproval();
      (prisma.ticketApproval.findUnique as jest.Mock).mockResolvedValueOnce(approval);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 99,
        roleAssignments: [{ role: Role.Admin, area: Area.Obras, isActive: true }],
      });

      await expect(service.approveStep(10, 1, 99, { approved: true })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws when previous approval step not completed', async () => {
      const approval = buildApproval({ step: 2 });
      (prisma.ticketApproval.findUnique as jest.Mock).mockResolvedValueOnce({
        ...approval,
        ticket: {
          id: 10,
          status: TicketStatus.Pendiente,
          approvals: [
            { id: 1, step: 1, status: ApprovalStatus.Pendiente },
            { id: 2, step: 2, status: ApprovalStatus.Pendiente },
          ],
        },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 5,
        roleAssignments: [{ role: Role.Supervisor, area: Area.Transporte, isActive: true }],
      });

      await expect(service.approveStep(10, 2, 5, { approved: true })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('approves first step and emits in-progress event', async () => {
      const approval = buildApproval();
      const updatedTicket = { id: 10, status: TicketStatus.EnProgreso } as any;

      (prisma.ticketApproval.findUnique as jest.Mock).mockResolvedValueOnce(approval);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 5,
        roleAssignments: [{ role: Role.Supervisor, area: Area.Transporte, isActive: true }],
      });
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => callback(prisma));
      (prisma.ticketApproval.update as jest.Mock).mockResolvedValueOnce({});
      (prisma.ticket.update as jest.Mock).mockResolvedValueOnce(updatedTicket);

      const result = await service.approveStep(10, 1, 5, { approved: true });

      expect(prisma.ticketApproval.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ApprovalStatus.Aprobado,
            approvedById: 5,
          }),
        }),
      );
      expect(prisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: { status: TicketStatus.EnProgreso },
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'approval.inProgress',
        expect.objectContaining({ ticket: approval.ticket, approverId: 5 }),
      );
      expect(result).toBe(updatedTicket);
    });

    it('marks rejection by closing ticket', async () => {
      const approval = buildApproval();
      const updatedTicket = { id: 10, status: TicketStatus.Cerrado } as any;

      (prisma.ticketApproval.findUnique as jest.Mock).mockResolvedValueOnce(approval);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 6,
        roleAssignments: [{ role: Role.Supervisor, area: Area.Transporte, isActive: true }],
      });
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => callback(prisma));
      (prisma.ticketApproval.update as jest.Mock).mockResolvedValueOnce({});
      (prisma.ticket.update as jest.Mock).mockResolvedValueOnce(updatedTicket);

      const result = await service.approveStep(10, 1, 6, { approved: false, comments: 'Missing data' });

      expect(prisma.ticketApproval.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ApprovalStatus.Rechazado, comments: 'Missing data' }),
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'approval.rejected',
        expect.objectContaining({ ticket: approval.ticket, approverId: 6 }),
      );
      expect(result).toBe(updatedTicket);
    });
  });

  describe('remove', () => {
    it('throws when ticket does not exist', async () => {
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletes ticket when present', async () => {
      const ticket = { id: 1 } as any;
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValueOnce(ticket);
      (prisma.ticket.delete as jest.Mock).mockResolvedValueOnce(ticket);

      const result = await service.remove(1);

      expect(prisma.ticket.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBe(ticket);
    });
  });
});
