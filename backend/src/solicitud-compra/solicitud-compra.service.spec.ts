import { Test, TestingModule } from '@nestjs/testing';
import { SolicitudCompraService } from './solicitud-compra.service';
import { PrismaService } from 'prisma/prisma.service';
import { CreateSolicitudCompraDto } from './dto/create-solicitud-compra.dto';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

// Mock completo de PrismaService
const mockPrismaService = {
  solicitudCompra: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
};

describe('SolicitudCompraService', () => {
  let service: SolicitudCompraService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SolicitudCompraService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SolicitudCompraService>(SolicitudCompraService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSolicitudCompra', () => {
    it('debería crear una solicitud de compra exitosamente', async () => {
      const createSolicitudCompraDto: CreateSolicitudCompraDto = {
        monto: 1000,
        repuestos: [],
      };

      const expectedResult = {
        id: 1,
        monto: 1000,
        aprobada: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrismaService.solicitudCompra.create.mockResolvedValue(expectedResult);

      const result = await service.createSolicitudCompra(createSolicitudCompraDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.solicitudCompra.create).toHaveBeenCalledWith({
        data: {
          monto: 1000,
          repuestos: {
            create: [],
          },
        },
      });
    });

    it('debería crear una solicitud sin repuestos', async () => {
      const createSolicitudCompraDto: CreateSolicitudCompraDto = {
        monto: 500,
      };

      const expectedResult = {
        id: 2,
        monto: 500,
        aprobada: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrismaService.solicitudCompra.create.mockResolvedValue(expectedResult);

      const result = await service.createSolicitudCompra(createSolicitudCompraDto);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAllSolicitudCompra', () => {
    it('debería retornar array vacío cuando no hay solicitudes', async () => {
      mockPrismaService.solicitudCompra.findMany.mockResolvedValue([]);

      const result = await service.findAllSolicitudCompra();

      expect(result).toEqual([]);
      expect(mockPrismaService.solicitudCompra.findMany).toHaveBeenCalledWith({
        include: { repuestos: true },
      });
    });

    it('debería retornar todas las solicitudes con repuestos', async () => {
      const solicitudes = [
        {
          id: 1,
          monto: 1000,
          aprobada: false,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          repuestos: [],
        },
        {
          id: 2,
          monto: 2000,
          aprobada: true,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          repuestos: [{ id: 1, nombre: 'Filtro', precio: 100 }],
        },
      ];

      mockPrismaService.solicitudCompra.findMany.mockResolvedValue(solicitudes);

      const result = await service.findAllSolicitudCompra();

      expect(result).toEqual(solicitudes);
      expect(result).toHaveLength(2);
    });
  });

  describe('findOneSolicitudCompra', () => {
    it('debería encontrar una solicitud por ID con repuestos', async () => {
      const solicitud = {
        id: 1,
        monto: 1000,
        aprobada: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        repuestos: [{ id: 1, nombre: 'Filtro', precio: 100 }],
      };

      mockPrismaService.solicitudCompra.findUnique.mockResolvedValue(solicitud);

      const result = await service.findOneSolicitudCompra(1);

      expect(result).toEqual(solicitud);
      expect(mockPrismaService.solicitudCompra.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { repuestos: true },
      });
    });

    it('debería retornar null cuando la solicitud no existe', async () => {
      mockPrismaService.solicitudCompra.findUnique.mockResolvedValue(null);

      const result = await service.findOneSolicitudCompra(999);

      expect(result).toBeNull();
    });
  });

  describe('removeSolicitudCompra', () => {
    it('debería eliminar una solicitud exitosamente', async () => {
      const solicitudEliminada = {
        id: 1,
        monto: 1000,
        aprobada: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrismaService.solicitudCompra.delete.mockResolvedValue(solicitudEliminada);

      const result = await service.removeSolicitudCompra(1);

      expect(result).toEqual(solicitudEliminada);
      expect(mockPrismaService.solicitudCompra.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('debería lanzar NotFoundException cuando la solicitud no existe', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Record to delete does not exist', {
        code: 'P2025',
        clientVersion: '4.0.0',
      } as any);

      mockPrismaService.solicitudCompra.delete.mockRejectedValue(prismaError);

      await expect(service.removeSolicitudCompra(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('aprobarSolicitud', () => {
    it('debería aprobar una solicitud exitosamente', async () => {
      const solicitudAprobada = {
        id: 1,
        monto: 1000,
        aprobada: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockPrismaService.solicitudCompra.update.mockResolvedValue(solicitudAprobada);

      const result = await service.aprobarSolicitud(1);

      expect(result).toEqual(solicitudAprobada);
      expect(result.aprobada).toBe(true);
      expect(mockPrismaService.solicitudCompra.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { aprobada: true },
      });
    });

    it('debería lanzar NotFoundException cuando la solicitud no existe', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Record to update not found', {
        code: 'P2025',
        clientVersion: '4.0.0',
      } as any);

      mockPrismaService.solicitudCompra.update.mockRejectedValue(prismaError);

      await expect(service.aprobarSolicitud(999)).rejects.toThrow(NotFoundException);
    });
  });

  // Tests edge cases
  describe('casos edge', () => {
    it('debería manejar monto cero', async () => {
      const createSolicitudCompraDto: CreateSolicitudCompraDto = {
        monto: 0,
      };

      const expectedResult = {
        id: 3,
        monto: 0,
        aprobada: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrismaService.solicitudCompra.create.mockResolvedValue(expectedResult);

      const result = await service.createSolicitudCompra(createSolicitudCompraDto);

      expect(result.monto).toBe(0);
    });

    it('debería manejar monto negativo (si la BD lo permite)', async () => {
      const createSolicitudCompraDto: CreateSolicitudCompraDto = {
        monto: -100,
      };

      const expectedResult = {
        id: 4,
        monto: -100,
        aprobada: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrismaService.solicitudCompra.create.mockResolvedValue(expectedResult);

      const result = await service.createSolicitudCompra(createSolicitudCompraDto);

      expect(result.monto).toBe(-100);
    });
  });
});
