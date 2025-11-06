import { NotFoundException } from '@nestjs/common';
import { IncidentService } from './incident.service';
import { createPrismaMock, PrismaMock } from '../../../test/utils/mock-prisma';
import { IncidentStatus } from '@prisma/client';
import { TenantContextService } from '@/app/core/tenant-context.service';

describe('IncidentService', () => {
  let service: IncidentService;
  let prisma: PrismaMock;
  const tenantContext = { tenantId: 13 } as unknown as TenantContextService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new IncidentService(prisma, tenantContext);
  });

  describe('create', () => {
    it('persists incident with default status and location payload', async () => {
      (prisma.incident.create as jest.Mock).mockResolvedValueOnce({ id: 1 });

      await service.create(
        {
          title: 'Leak',
          description: 'Water leak',
          area: 'A',
          type: 'Water',
          severity: 'High',
          address: 'Street 1',
          latitude: 1.23,
        } as any,
        5,
      );

      expect(prisma.incident.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: IncidentStatus.REPORTED,
            location: expect.objectContaining({ direccion: 'Street 1', latitude: 1.23 }),
            tenant: { connect: { id: tenantContext.tenantId } },
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('returns paginated incidents', async () => {
      (prisma.incident.findMany as jest.Mock).mockResolvedValueOnce([{ id: 1 }]);
      (prisma.incident.count as jest.Mock).mockResolvedValueOnce(1);

      const result = await service.findAll({ page: 1, pageSize: 5 });

      expect(result).toEqual({ items: [{ id: 1 }], total: 1, page: 1, pageSize: 5, totalPages: 1 });
    });
  });

  describe('findOne', () => {
    it('throws when missing', async () => {
      (prisma.incident.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.findOne(3)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates incident with selective fields', async () => {
      (prisma.incident.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1 });
      (prisma.incident.update as jest.Mock).mockResolvedValueOnce({ id: 1, status: IncidentStatus.RESOLVED });

      await service.update(1, { status: IncidentStatus.RESOLVED, longitude: -1.2 } as any);

      expect(prisma.incident.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: IncidentStatus.RESOLVED,
            location: { longitude: -1.2 },
          }),
        }),
      );
    });
  });
});
