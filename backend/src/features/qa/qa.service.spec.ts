import { QaService } from './qa.service';
import { createPrismaMock, PrismaMock } from '../../../test/utils/mock-prisma';
import { TenantContextService } from '@/app/core/tenant-context.service';

describe('QaService', () => {
  let service: QaService;
  let prisma: PrismaMock;
  const tenantContext = { tenantId: 33 } as unknown as TenantContextService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new QaService(prisma, tenantContext);
  });

  describe('create', () => {
    it('throws when work order missing', async () => {
      (prisma.ordenTrabajo.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.create({ otId: 1, checklist: '', resultado: '' })).rejects.toThrow(
        'The work order with ID 1 was not found.',
      );
    });

    it('creates QA entry when OT exists', async () => {
      (prisma.ordenTrabajo.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1 });
      (prisma.qA.create as jest.Mock).mockResolvedValueOnce({ id: 2 });

      const result = await service.create({ otId: 1, checklist: 'c', resultado: 'ok' });

      expect(prisma.qA.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { otId: 1, checklist: 'c', resultado: 'ok', tenantId: tenantContext.tenantId },
        }),
      );
      expect(result).toEqual({ id: 2 });
    });
  });

  describe('findAll', () => {
    it('returns paginated QA results', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValueOnce([[{ id: 1 }], 1]);

      const result = await service.findAll({ page: 1, pageSize: 5 });
      expect(result.total).toBe(1);
    });
  });

  describe('bloquearLiberacion', () => {
    it('updates order status to bloqueada', async () => {
      (prisma.ordenTrabajo.update as jest.Mock).mockResolvedValueOnce({ id: 1, estado: 'bloqueada' });

      const result = await service.bloquearLiberacion(1);

      expect(prisma.ordenTrabajo.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { estado: 'bloqueada' } }),
      );
      expect(result).toEqual({ id: 1, estado: 'bloqueada' });
    });
  });
});
