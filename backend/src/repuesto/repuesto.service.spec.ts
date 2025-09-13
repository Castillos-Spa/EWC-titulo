import { Test, TestingModule } from '@nestjs/testing';
import { RepuestoService } from './repuesto.service';
import { PrismaService } from 'prisma/prisma.service';
import { CreateRepuestoDto } from './dto/create-repuesto.dto';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

// Mock completo de PrismaService
const mockPrismaService = {
  repuesto: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('RepuestoService', () => {
  let service: RepuestoService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepuestoService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RepuestoService>(RepuestoService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería crear un repuesto exitosamente', async () => {
      const createRepuestoDto: CreateRepuestoDto = {
        nombre: 'Filtro de aceite',
        stock: 50,
        costoUnitario: 25.99,
      };

      const expectedResult = {
        id: 1,
        ...createRepuestoDto,
        solicitudCompraId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrismaService.repuesto.create.mockResolvedValue(expectedResult);

      const result = await service.create(createRepuestoDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.repuesto.create).toHaveBeenCalledWith({
        data: {
          nombre: 'Filtro de aceite',
          stock: 50,
          costoUnitario: 25.99,
          solicitudCompraId: undefined,
        },
      });
    });

    it('debería crear un repuesto con solicitudCompraId', async () => {
      const createRepuestoDto: CreateRepuestoDto = {
        nombre: 'Filtro de aceite',
        stock: 50,
        costoUnitario: 25.99,
        solicitudCompraId: 1,
      };

      const expectedResult = {
        id: 1,
        ...createRepuestoDto,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrismaService.repuesto.create.mockResolvedValue(expectedResult);

      const result = await service.create(createRepuestoDto);

      expect(result.solicitudCompraId).toBe(1);
    });
  });

  describe('findAll', () => {
    it('debería retornar array vacío cuando no hay repuestos', async () => {
      mockPrismaService.repuesto.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(mockPrismaService.repuesto.findMany).toHaveBeenCalledWith({
        include: { solicitudCompra: true },
      });
    });

    it('debería retornar todos los repuestos con solicitudCompra', async () => {
      const repuestos = [
        {
          id: 1,
          nombre: 'Filtro de aceite',
          stock: 50,
          costoUnitario: 25.99,
          solicitudCompraId: 1,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          solicitudCompra: {
            id: 1,
            monto: 1000,
            aprobada: false,
          },
        },
      ];

      mockPrismaService.repuesto.findMany.mockResolvedValue(repuestos);

      const result = await service.findAll();

      expect(result).toEqual(repuestos);
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('debería encontrar un repuesto por ID con solicitudCompra', async () => {
      const repuesto = {
        id: 1,
        nombre: 'Filtro de aceite',
        stock: 50,
        costoUnitario: 25.99,
        solicitudCompraId: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        solicitudCompra: {
          id: 1,
          monto: 1000,
          aprobada: false,
        },
      };

      mockPrismaService.repuesto.findUnique.mockResolvedValue(repuesto);

      const result = await service.findOne(1);

      expect(result).toEqual(repuesto);
      expect(mockPrismaService.repuesto.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { solicitudCompra: true },
      });
    });

    it('debería retornar null cuando el repuesto no existe', async () => {
      mockPrismaService.repuesto.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('updateStock', () => {
    it('debería actualizar el stock de un repuesto', async () => {
      const repuestoActualizado = {
        id: 1,
        nombre: 'Filtro de aceite',
        stock: 30, // Stock actualizado
        costoUnitario: 25.99,
        solicitudCompraId: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockPrismaService.repuesto.update.mockResolvedValue(repuestoActualizado);

      const result = await service.updateStock(1, 30);

      expect(result).toEqual(repuestoActualizado);
      expect(result.stock).toBe(30);
      expect(mockPrismaService.repuesto.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stock: 30 },
      });
    });

    it('debería lanzar NotFoundException cuando el repuesto no existe', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Record to update not found', {
        code: 'P2025',
        clientVersion: '4.0.0',
      } as any);

      mockPrismaService.repuesto.update.mockRejectedValue(prismaError);

      await expect(service.updateStock(999, 30)).rejects.toThrow(NotFoundException);
    });
  });

  describe('generarAlertaStockMinimo', () => {
    it('debería generar alerta cuando stock es menor al mínimo', async () => {
      const repuesto = {
        id: 1,
        nombre: 'Filtro de aceite',
        stock: 5, // Stock bajo
        costoUnitario: 25.99,
        solicitudCompraId: 1,
      };

      mockPrismaService.repuesto.findUnique.mockResolvedValue(repuesto);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await service.generarAlertaStockMinimo(1, 10);

      expect(result).toEqual(repuesto);
      expect(consoleSpy).toHaveBeenCalledWith('Alerta: Stock mínimo para el repuesto Filtro de aceite');

      consoleSpy.mockRestore();
    });

    it('debería no generar alerta cuando stock es mayor al mínimo', async () => {
      const repuesto = {
        id: 1,
        nombre: 'Filtro de aceite',
        stock: 15, // Stock suficiente
        costoUnitario: 25.99,
        solicitudCompraId: 1,
      };

      mockPrismaService.repuesto.findUnique.mockResolvedValue(repuesto);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await service.generarAlertaStockMinimo(1, 10);

      expect(result).toEqual(repuesto);
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('debería lanzar error cuando el repuesto no existe', async () => {
      mockPrismaService.repuesto.findUnique.mockResolvedValue(null);

      await expect(service.generarAlertaStockMinimo(999, 10)).rejects.toThrow('Repuesto con ID 999 no encontrado');
    });
  });

  describe('remove', () => {
    it('debería eliminar un repuesto exitosamente', async () => {
      const repuestoEliminado = {
        id: 1,
        nombre: 'Filtro de aceite',
        stock: 50,
        costoUnitario: 25.99,
        solicitudCompraId: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrismaService.repuesto.delete.mockResolvedValue(repuestoEliminado);

      const result = await service.remove(1);

      expect(result).toEqual(repuestoEliminado);
      expect(mockPrismaService.repuesto.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('debería lanzar NotFoundException cuando el repuesto no existe', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Record to delete does not exist', {
        code: 'P2025',
        clientVersion: '4.0.0',
      } as any);

      mockPrismaService.repuesto.delete.mockRejectedValue(prismaError);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  // Tests edge cases
  describe('casos edge', () => {
    it('debería manejar stock cero', async () => {
      const createRepuestoDto: CreateRepuestoDto = {
        nombre: 'Filtro',
        stock: 0,
        costoUnitario: 25.99,
      };

      const expectedResult = {
        id: 3,
        ...createRepuestoDto,
        solicitudCompraId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrismaService.repuesto.create.mockResolvedValue(expectedResult);

      const result = await service.create(createRepuestoDto);

      expect(result.stock).toBe(0);
    });

    it('debería manejar costo unitario cero', async () => {
      const createRepuestoDto: CreateRepuestoDto = {
        nombre: 'Filtro',
        stock: 50,
        costoUnitario: 0,
      };

      const expectedResult = {
        id: 4,
        ...createRepuestoDto,
        solicitudCompraId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrismaService.repuesto.create.mockResolvedValue(expectedResult);

      const result = await service.create(createRepuestoDto);

      expect(result.costoUnitario).toBe(0);
    });
  });
});
