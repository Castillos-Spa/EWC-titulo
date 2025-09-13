// qa.service.spec.ts (corregido)
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'prisma/prisma.service';
import { QaService } from './qa.service';
import { CreateQADto } from './dto/create-qa.dto';
import { NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  ordenTrabajo: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  qA: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
};

describe('QaService', () => {
  let service: QaService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QaService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<QaService>(QaService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería crear un registro QA cuando la orden de trabajo existe', async () => {
      const createDto: CreateQADto = {
        otId: 1,
        checklist: 'Checklist completado',
        resultado: 'Aprobado',
      };

      const ordenTrabajoMock = { id: 1, estado: 'abierta' };
      const qaResultMock = {
        id: 1,
        otId: 1,
        checklist: 'Checklist completado',
        resultado: 'Aprobado',
      };

      mockPrismaService.ordenTrabajo.findUnique.mockResolvedValue(ordenTrabajoMock);
      mockPrismaService.qA.create.mockResolvedValue(qaResultMock);

      const result = await service.create(createDto);

      expect(result).toEqual(qaResultMock);
      expect(mockPrismaService.ordenTrabajo.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrismaService.qA.create).toHaveBeenCalledWith({
        data: {
          otId: 1,
          checklist: 'Checklist completado',
          resultado: 'Aprobado',
        },
      });
    });

    it('debería lanzar error cuando la orden de trabajo no existe', async () => {
      const createDto: CreateQADto = {
        otId: 999,
        checklist: 'Checklist',
        resultado: 'Resultado',
      };

      mockPrismaService.ordenTrabajo.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow('The work order with ID 999 was not found.');
    });

    it('debería lanzar error si Prisma falla al buscar la orden', async () => {
      const createDto: CreateQADto = {
        otId: 1,
        checklist: 'Checklist',
        resultado: 'Resultado',
      };

      mockPrismaService.ordenTrabajo.findUnique.mockRejectedValue(new Error('Error de base de datos'));

      await expect(service.create(createDto)).rejects.toThrow('Error de base de datos');
    });
  });

  describe('findAll', () => {
    it('debería retornar todos los registros QA con relaciones', async () => {
      const expectedResult = [
        {
          id: 1,
          otId: 1,
          checklist: 'Checklist 1',
          resultado: 'Aprobado',
          ot: { id: 1, estado: 'abierta' },
        },
      ];

      mockPrismaService.qA.findMany.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.qA.findMany).toHaveBeenCalledWith({
        include: { ot: true },
      });
    });

    it('debería retornar array vacío si no hay registros QA', async () => {
      mockPrismaService.qA.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(mockPrismaService.qA.findMany).toHaveBeenCalledWith({
        include: { ot: true },
      });
    });
  });

  describe('findOne', () => {
    it('debería retornar un registro QA por ID', async () => {
      const expectedResult = {
        id: 1,
        otId: 1,
        checklist: 'Checklist 1',
        resultado: 'Aprobado',
        ot: { id: 1, estado: 'abierta' },
      };

      mockPrismaService.qA.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findOne(1);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.qA.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { ot: true },
      });
    });

    it('debería retornar null si el registro QA no existe', async () => {
      mockPrismaService.qA.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });

    it('debería lanzar error si Prisma falla al buscar', async () => {
      mockPrismaService.qA.findUnique.mockRejectedValue(new Error('Error de base de datos'));

      await expect(service.findOne(1)).rejects.toThrow('Error de base de datos');
    });
  });

  describe('bloquearLiberacion', () => {
    it('debería bloquear la liberación de un vehículo', async () => {
      const expectedResult = {
        id: 1,
        estado: 'bloqueada',
        vehiculoId: 1,
        tipo: 'reparación',
      };

      mockPrismaService.ordenTrabajo.update.mockResolvedValue(expectedResult);

      const result = await service.bloquearLiberacion(1);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.ordenTrabajo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { estado: 'bloqueada' },
      });
    });

    it('debería lanzar error si Prisma falla al bloquear', async () => {
      mockPrismaService.ordenTrabajo.update.mockRejectedValue(new Error('Error de base de datos'));

      await expect(service.bloquearLiberacion(1)).rejects.toThrow('Error de base de datos');
    });
  });

  describe('remove', () => {
    it('debería eliminar un registro QA', async () => {
      const expectedResult = {
        id: 1,
        otId: 1,
        checklist: 'Checklist 1',
        resultado: 'Aprobado',
      };

      mockPrismaService.qA.delete.mockResolvedValue(expectedResult);

      const result = await service.remove(1);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.qA.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('debería lanzar error si Prisma falla al eliminar', async () => {
      mockPrismaService.qA.delete.mockRejectedValue(new Error('Error de base de datos'));

      await expect(service.remove(1)).rejects.toThrow('Error de base de datos');
    });
  });

  // Test adicional para verificar el tipo de error lanzado
  describe('Manejo de errores específicos', () => {
    it('debería lanzar Error (no NotFoundException) cuando la OT no existe', async () => {
      const createDto: CreateQADto = {
        otId: 999,
        checklist: 'Checklist',
        resultado: 'Resultado',
      };

      mockPrismaService.ordenTrabajo.findUnique.mockResolvedValue(null);

      try {
        await service.create(createDto);
        fail('Debería haber lanzado un error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(NotFoundException);
        expect(error.message).toBe('The work order with ID 999 was not found.');
      }
    });
  });
});
