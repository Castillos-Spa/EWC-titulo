import { NotFoundException } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { createPrismaMock, PrismaMock } from '../../../test/utils/mock-prisma';
import { TenantContextService } from '@/app/core/tenant-context.service';

describe('RoutesService', () => {
  let service: RoutesService;
  let prisma: PrismaMock;
  const tenantContext = { tenantId: 99 } as unknown as TenantContextService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new RoutesService(prisma, tenantContext);
  });

  describe('findAll', () => {
    it('returns paginated transport routes', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValueOnce([[{ id: 1 }], 1]);

      const result = await service.findAll({ page: 2, pageSize: 5 });

      expect(prisma.transportRoute.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 5, take: 5 }));
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('throws when route missing', async () => {
      (prisma.transportRoute.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.findOne(10)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('createAssignment', () => {
    it('casts ids to numbers before persisting', async () => {
      (prisma.truckAssignment.create as jest.Mock).mockResolvedValueOnce({ id: 1 });

      await service.createAssignment({ truckId: '1', routeId: '2', driverId: '3' });

      expect(prisma.truckAssignment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ truckId: 1, routeId: 2, driverId: 3, tenantId: tenantContext.tenantId }),
        }),
      );
    });
  });
});
