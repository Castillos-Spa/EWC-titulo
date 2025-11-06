import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CleaningService } from './cleaning.service';
import { createPrismaMock, PrismaMock } from '../../../test/utils/mock-prisma';
import { TenantContextService } from '@/app/core/tenant-context.service';

describe('CleaningService', () => {
  let service: CleaningService;
  let prisma: PrismaMock;
  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;
  const tenantContext = { tenantId: 55 } as unknown as TenantContextService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    service = new CleaningService(prisma, eventEmitter, tenantContext);
  });

  describe('create', () => {
    it('stores report and emits domain event', async () => {
      const dto = { area: 'Warehouse', date: '2024-01-01' } as any;
      (prisma.aseo.create as jest.Mock).mockResolvedValueOnce({ id: 1, area: 'Warehouse' });

      const result = await service.create(dto, 5);

      expect(prisma.aseo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            createdBy: { connect: { id: 5 } },
            tenant: { connect: { id: tenantContext.tenantId } },
          }),
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'cleaning_report.created',
        expect.objectContaining({ createdById: 5 }),
      );
      expect(result).toEqual({ id: 1, area: 'Warehouse' });
    });
  });

  describe('findAll', () => {
    it('returns paginated list', async () => {
      (prisma.aseo.findMany as jest.Mock).mockResolvedValueOnce([{ id: 1 }]);
      (prisma.aseo.count as jest.Mock).mockResolvedValueOnce(1);

      const result = await service.findAll({ page: 2, pageSize: 5 });

      expect(prisma.aseo.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 5, take: 5 }));
      expect(result).toEqual({ items: [{ id: 1 }], total: 1, page: 2, pageSize: 5 });
    });
  });

  describe('findOne', () => {
    it('throws when record missing', async () => {
      (prisma.aseo.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.findOne(9)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates report and emits event', async () => {
      (prisma.aseo.update as jest.Mock).mockResolvedValueOnce({ id: 1 });

      await service.update(1, { timeSpent: 2 }, 8);

      expect(prisma.aseo.update).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'cleaning_report.updated',
        expect.objectContaining({ actorId: 8 }),
      );
    });
  });
});
