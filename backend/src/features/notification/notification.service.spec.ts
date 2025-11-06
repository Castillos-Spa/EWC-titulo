import { NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { createPrismaMock, PrismaMock } from '../../../test/utils/mock-prisma';
import { NotificationGateway } from './notification.gateway';
import { Role } from '@prisma/client';
import { TenantContextService } from '@/app/core/tenant-context.service';

const createGatewayMock = () => ({
  sendNotification: jest.fn(),
});

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: PrismaMock;
  const gateway = createGatewayMock() as unknown as jest.Mocked<NotificationGateway>;
  const tenantContext = { tenantId: 27 } as unknown as TenantContextService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    service = new NotificationService(prisma, gateway, tenantContext);
  });

  describe('createNotification', () => {
    it('persists and emits notification', async () => {
      const created = { id: 10 } as any;
      const enriched = { id: 10, user: { id: 50 } } as any;

      (prisma.notification.create as jest.Mock).mockResolvedValueOnce(created);
      (prisma.notification.findUnique as jest.Mock).mockResolvedValueOnce(enriched);

      const input = {
        title: 'Hello',
        message: 'World',
        createdById: 1,
        areas: ['Transporte'],
        roles: [Role.Admin],
        type: 'ticket',
      };

      const result = await service.createNotification(input);

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Hello',
            message: 'World',
            tenant: { connect: { id: tenantContext.tenantId } },
          }),
        }),
      );
      expect(gateway.sendNotification).toHaveBeenCalledWith(enriched);
      expect(result).toEqual(enriched);
    });
  });

  describe('findAllForUser', () => {
    it('filters notifications for non-admin users', async () => {
      const user = {
        id: 1,
        roleAssignments: [{ id: 1, role: Role.Supervisor, area: 'Transporte', permissions: [], isActive: true }],
      } as any;
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(user);
      (prisma.$transaction as jest.Mock).mockResolvedValueOnce([[{ id: 1 }], 1]);

      const result = await service.findAllForUser(1, { page: 1, pageSize: 10 });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 10,
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          items: [{ id: 1 }],
          total: 1,
          page: 1,
          pageSize: 10,
        }),
      );
    });

    it('throws when user is missing', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.findAllForUser(999, { page: 1, pageSize: 10 })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('markAsRead', () => {
    it('upserts read status and returns notification', async () => {
      const notification = { id: 10 } as any;
      (prisma.userNotification.upsert as jest.Mock).mockResolvedValueOnce({});
      (prisma.notification.findUnique as jest.Mock).mockResolvedValueOnce(notification);

      const result = await service.markAsRead(10, 5);

      expect(prisma.userNotification.upsert).toHaveBeenCalledWith({
        where: { userId_notificationId: { notificationId: 10, userId: 5 } },
        update: { read: true },
        create: { userId: 5, notificationId: 10, read: true, tenantId: tenantContext.tenantId },
      });
      expect(result).toBe(notification);
    });
  });

  describe('event handlers', () => {
    it('handles ticket.assigned by forwarding to createNotification', async () => {
      const spy = jest.spyOn(service, 'createNotification').mockResolvedValueOnce({} as any);

      await service.handleTicketAssignedEvent({
        ticket: { title: 'Ticket' } as any,
        assignedToId: 2,
        createdById: 1,
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 2,
          type: 'ticket',
        }),
      );
    });
  });
});
