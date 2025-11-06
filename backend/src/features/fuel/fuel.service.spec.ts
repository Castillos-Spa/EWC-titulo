import { NotFoundException } from '@nestjs/common';
import { FuelService } from './fuel.service';
import { createPrismaMock, PrismaMock } from '../../../test/utils/mock-prisma';
import { UsersService } from '@/features/users/users.service';
import { Role } from '@prisma/client';

describe('FuelService', () => {
  let service: FuelService;
  let prisma: PrismaMock;
  const usersService = {
    findById: jest.fn(),
  } as unknown as jest.Mocked<UsersService>;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    service = new FuelService(prisma, usersService);
  });

  describe('createFuelLog', () => {
    it('throws when vehicle does not exist', async () => {
      (prisma.vehiculo.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.createFuelLog({ vehiculoId: 1 } as any, 5)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('creates log when vehicle exists', async () => {
      (prisma.vehiculo.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1 });
      (prisma.fuelLog.create as jest.Mock).mockResolvedValueOnce({ id: 10 });

      const result = await service.createFuelLog({ vehiculoId: 1, date: '2024-01-01', quantity: 10 } as any, 3);

      expect(prisma.fuelLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ driver: { connect: { id: 3 } } }),
        }),
      );
      expect(result).toEqual({ id: 10 });
    });
  });

  describe('getVehicleFuelHistory', () => {
    it('throws when user not found', async () => {
      usersService.findById.mockResolvedValueOnce(null as any);

      await expect(service.getVehicleFuelHistory(1, 99, { page: 1, pageSize: 5 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns paginated history', async () => {
      usersService.findById.mockResolvedValueOnce({
        id: 1,
        roleAssignments: [{ role: Role.Admin }],
      } as any);
      (prisma.vehiculo.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1 });
      (prisma.$transaction as jest.Mock).mockResolvedValueOnce([[{ id: 1 }], 1]);

      const result = await service.getVehicleFuelHistory(1, 1, { page: 2, pageSize: 2 });

      expect(prisma.fuelLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 2, take: 2 }));
      expect(result).toEqual({ items: [{ id: 1 }], total: 1, page: 2, pageSize: 2, totalPages: 1 });
    });
  });

  describe('getFleetFuelSummary', () => {
    it('throws when user not found', async () => {
      usersService.findById.mockResolvedValueOnce(null as any);

      await expect(service.getFleetFuelSummary(5, { page: 1, pageSize: 5 })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns paginated vehicles', async () => {
      usersService.findById.mockResolvedValueOnce({
        id: 1,
        roleAssignments: [{ role: Role.Admin }],
      } as any);
      (prisma.$transaction as jest.Mock).mockResolvedValueOnce([[{ id: 1, fuelLogs: [] }], 1]);

      const result = await service.getFleetFuelSummary(1, { page: 1, pageSize: 10 });

      expect(prisma.vehiculo.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
      expect(result).toEqual({ items: [{ id: 1, fuelLogs: [] }], total: 1, page: 1, pageSize: 10, totalPages: 1 });
    });
  });
});
