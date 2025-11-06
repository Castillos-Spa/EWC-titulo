import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkOrderService, WorkOrderStatus } from './work-order.service';
import { createPrismaMock, PrismaMock } from '../../../test/utils/mock-prisma';
import { TenantContextService } from '@/app/core/tenant-context.service';

describe('WorkOrderService', () => {
  let service: WorkOrderService;
  let prisma: PrismaMock;
  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;
  const tenantContext = { tenantId: 21 } as unknown as TenantContextService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    service = new WorkOrderService(prisma, eventEmitter, tenantContext);
  });

  describe('create', () => {
    it('creates work order in transaction and emits event', async () => {
      const created = { id: 1, vehiculoId: 2 } as any;
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => fn(prisma));
      (prisma.ordenTrabajo.create as jest.Mock).mockResolvedValueOnce(created);
      (prisma.vehiculo.update as jest.Mock).mockResolvedValueOnce({});

      const result = await service.create({ vehiculoId: 2, scheduledDate: '2024-01-01' } as any);

      expect(prisma.ordenTrabajo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: WorkOrderStatus.OPEN,
            tenant: { connect: { id: tenantContext.tenantId } },
          }),
        }),
      );
      expect(prisma.vehiculo.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ lastMaintenanceDate: expect.any(Date) }) }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('ot.created', created);
      expect(result).toBe(created);
    });
  });

  describe('findOne', () => {
    it('throws when not found', async () => {
      (prisma.ordenTrabajo.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('notifies when status becomes pending review', async () => {
      (prisma.ordenTrabajo.update as jest.Mock).mockResolvedValueOnce({ id: 1, estado: WorkOrderStatus.UNDER_REVIEW });

      await service.updateStatus(1, WorkOrderStatus.UNDER_REVIEW);

      expect(eventEmitter.emit).toHaveBeenCalledWith('orden_trabajo.pendiente_revision', {
        id: 1,
        estado: WorkOrderStatus.UNDER_REVIEW,
      });
    });
  });

  describe('cerrarOT', () => {
    it('updates work order to closed and creates QA entry', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => fn(prisma));
      (prisma.ordenTrabajo.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1 });
      (prisma.ordenTrabajo.update as jest.Mock).mockResolvedValueOnce({});
      (prisma.qA.create as jest.Mock).mockResolvedValueOnce({ id: 5 });

      const result = await service.cerrarOT(1, 'check', 'ok');

      expect(prisma.qA.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            ot: { connect: { id: 1 } },
            checklist: 'check',
            resultado: 'ok',
            tenant: { connect: { id: tenantContext.tenantId } },
          },
        }),
      );
      expect(result).toEqual({ id: 5 });
    });
  });
});
