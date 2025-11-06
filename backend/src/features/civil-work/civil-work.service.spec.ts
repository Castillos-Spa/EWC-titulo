import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CivilWorkService } from './civil-work.service';
import { createPrismaMock, PrismaMock } from '../../../test/utils/mock-prisma';
import { CivilWorkStatus } from '@prisma/client';
import { TenantContextService } from '@/app/core/tenant-context.service';

describe('CivilWorkService', () => {
  let service: CivilWorkService;
  let prisma: PrismaMock;
  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;
  const tenantContext = { tenantId: 88 } as unknown as TenantContextService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    service = new CivilWorkService(prisma, eventEmitter, tenantContext);
  });

  describe('create', () => {
    it('stores civil work and emits event', async () => {
      const dto = {
        project: 'Bridge',
        location: 'Zone A',
        responsibleStaffUsernames: ['john', 'mary'],
        materialsUsed: ['cement'],
        tasks: ['foundation'],
      } as any;

      const stored = { id: 1, tasks: [], project: 'Bridge' } as any;
      (prisma.civilWork.create as jest.Mock).mockResolvedValueOnce(stored);

      const result = await service.create(dto, 9);

      expect(prisma.civilWork.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            createdBy: { connect: { id: 9 } },
            tasks: [{ name: 'foundation', completed: false }],
            tenant: { connect: { id: tenantContext.tenantId } },
          }),
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('civilwork.created', stored);
      expect(result).toBe(stored);
    });
  });

  describe('updateTasks', () => {
    it('computes progress and status', async () => {
      (prisma.civilWork.update as jest.Mock).mockResolvedValueOnce({ id: 1, progress: 100 });

      const result = await service.updateTasks(1, [{ name: 'foundation', completed: true }]);

      expect(prisma.civilWork.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ progress: 100, status: CivilWorkStatus.COMPLETED }),
        }),
      );
      expect(result).toEqual({ id: 1, progress: 100 });
    });

    it('throws when tasks input invalid', async () => {
      await expect(service.updateTasks(1, null as any)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('throws when not found', async () => {
      (prisma.civilWork.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
