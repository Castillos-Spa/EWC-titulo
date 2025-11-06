import { ConflictException, NotFoundException } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { createPrismaMock, PrismaMock } from '../../../test/utils/mock-prisma';
import { TenantContextService } from '@/app/core/tenant-context.service';

describe('VehicleService', () => {
  let service: VehicleService;
  let prisma: PrismaMock;
  const tenantContext = { tenantId: 7 } as unknown as TenantContextService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new VehicleService(prisma, tenantContext);
  });

  describe('create', () => {
    it('normalizes plate and enforces uniqueness', async () => {
      (prisma.vehiculo.findUnique as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1 });
      (prisma.vehiculo.create as jest.Mock).mockResolvedValueOnce({ id: 2, patente: 'AAA111' });

      const created = await service.create({ patente: 'aaa111', tipo: ' Truck ', marca: 'X' } as any);

      expect(prisma.vehiculo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ patente: 'AAA111', tipo: 'Truck', tenantId: tenantContext.tenantId }),
        }),
      );
      expect(created).toEqual({ id: 2, patente: 'AAA111' });

      await expect(service.create({ patente: 'aaa111', tipo: null } as any)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findOne', () => {
    it('throws when not found', async () => {
      (prisma.vehiculo.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('honors trimmed tipo value', async () => {
      (prisma.vehiculo.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1 });
      (prisma.vehiculo.update as jest.Mock).mockResolvedValueOnce({ id: 1, tipo: 'Truck' });

      const updated = await service.update(1, { tipo: ' Truck ' } as any);

      expect(prisma.vehiculo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tipo: 'Truck' }),
        }),
      );
      expect(updated).toEqual({ id: 1, tipo: 'Truck' });
    });
  });

  describe('remove', () => {
    it('marks vehicle inactive after ensuring existence', async () => {
      (prisma.vehiculo.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1 });
      (prisma.vehiculo.update as jest.Mock).mockResolvedValueOnce({ id: 1, estado: 'inactivo' });

      const result = await service.remove(1);

      expect(prisma.vehiculo.update).toHaveBeenCalledWith(expect.objectContaining({ data: { estado: 'inactivo' } }));
      expect(result).toEqual({ id: 1, estado: 'inactivo' });
    });
  });
});
