// vehiculo.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { VehiculoService } from './vehiculo.service';
import { PrismaService } from 'prisma/prisma.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

// Mock completo de PrismaService
const mockPrismaService = {
  vehiculo: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  documento: {
    create: jest.fn(),
  },
};

describe('VehiculoService', () => {
  let service: VehiculoService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiculoService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<VehiculoService>(VehiculoService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createVehiculos', () => {
    it('debería crear un vehículo exitosamente', async () => {
      const createVehiculoDto: CreateVehiculoDto = {
        patente: 'ABC123',
        capacidad: 20000,
        odometro: 50000,
        estado: 'disponible',
      };

      const expectedResult = {
        id: 1,
        ...createVehiculoDto,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrismaService.vehiculo.create.mockResolvedValue(expectedResult);

      const result = await service.createVehiculos(createVehiculoDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.vehiculo.create).toHaveBeenCalledWith({
        data: createVehiculoDto,
      });
    });

    it('debería lanzar error con datos duplicados', async () => {
      const createVehiculoDto: CreateVehiculoDto = {
        patente: 'ABC123',
        capacidad: 20000,
        odometro: 50000,
        estado: 'disponible',
      };

      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '4.0.0',
      } as any);

      mockPrismaService.vehiculo.create.mockRejectedValue(prismaError);

      await expect(service.createVehiculos(createVehiculoDto)).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
    });
  });

  describe('findAllVehiculos', () => {
    it('debería retornar array vacío cuando no hay vehículos', async () => {
      mockPrismaService.vehiculo.findMany.mockResolvedValue([]);

      const result = await service.findAllVehiculos();

      expect(result).toEqual([]);
      expect(mockPrismaService.vehiculo.findMany).toHaveBeenCalled();
    });

    it('debería retornar todos los vehículos', async () => {
      const vehiculos = [
        {
          id: 1,
          patente: 'ABC123',
          capacidad: 20000,
          odometro: 50000,
          estado: 'disponible',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 2,
          patente: 'XYZ789',
          capacidad: 15000,
          odometro: 30000,
          estado: 'en_mantenimiento',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockPrismaService.vehiculo.findMany.mockResolvedValue(vehiculos);

      const result = await service.findAllVehiculos();

      expect(result).toEqual(vehiculos);
      expect(result).toHaveLength(2);
      expect(mockPrismaService.vehiculo.findMany).toHaveBeenCalled();
    });
  });

  describe('findOneVehiculos', () => {
    it('debería encontrar un vehículo por patente', async () => {
      const vehiculo = {
        id: 1,
        patente: 'ABC123',
        capacidad: 20000,
        odometro: 50000,
        estado: 'disponible',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrismaService.vehiculo.findFirst.mockResolvedValue(vehiculo);

      const result = await service.findOneVehiculos('ABC123');

      expect(result).toEqual(vehiculo);
      expect(mockPrismaService.vehiculo.findFirst).toHaveBeenCalledWith({
        where: { patente: 'ABC123' },
      });
    });

    it('debería retornar null cuando el vehículo no existe', async () => {
      mockPrismaService.vehiculo.findFirst.mockResolvedValue(null);

      const result = await service.findOneVehiculos('PATENTE999');

      expect(result).toBeNull();
      expect(mockPrismaService.vehiculo.findFirst).toHaveBeenCalledWith({
        where: { patente: 'PATENTE999' },
      });
    });
  });

  describe('updateVehiculo', () => {
    it('debería actualizar un vehículo exitosamente', async () => {
      const updateVehiculoDto: UpdateVehiculoDto = { estado: 'en_mantenimiento' };

      const vehiculoActualizado = {
        id: 1,
        patente: 'ABC123',
        capacidad: 20000,
        odometro: 50000,
        estado: 'en_mantenimiento',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockPrismaService.vehiculo.update.mockResolvedValue(vehiculoActualizado);

      const result = await service.updateVehiculo(1, updateVehiculoDto);

      expect(result).toEqual(vehiculoActualizado);
      expect(result.estado).toBe('en_mantenimiento');
      expect(mockPrismaService.vehiculo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateVehiculoDto,
      });
    });

    it('debería lanzar NotFoundException cuando el vehículo no existe', async () => {
      const updateVehiculoDto: UpdateVehiculoDto = { estado: 'en_mantenimiento' };

      const prismaError = new Prisma.PrismaClientKnownRequestError('Record to update not found', {
        code: 'P2025',
        clientVersion: '4.0.0',
      } as any);

      mockPrismaService.vehiculo.update.mockRejectedValue(prismaError);

      await expect(service.updateVehiculo(999, updateVehiculoDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeVehiculo', () => {
    it('debería eliminar un vehículo exitosamente', async () => {
      const vehiculoEliminado = {
        id: 1,
        patente: 'ABC123',
        capacidad: 20000,
        odometro: 50000,
        estado: 'disponible',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrismaService.vehiculo.delete.mockResolvedValue(vehiculoEliminado);

      const result = await service.removeVehiculo(1);

      expect(result).toEqual(vehiculoEliminado);
      expect(mockPrismaService.vehiculo.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('debería lanzar NotFoundException cuando el vehículo no existe', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Record to delete does not exist', {
        code: 'P2025',
        clientVersion: '4.0.0',
      } as any);

      mockPrismaService.vehiculo.delete.mockRejectedValue(prismaError);

      await expect(service.removeVehiculo(999)).rejects.toThrow(NotFoundException);
    });

    it('debería relanzar otros errores de Prisma', async () => {
      const otherError = new Prisma.PrismaClientKnownRequestError('Other error', {
        code: 'P1000',
        clientVersion: '4.0.0',
      } as any);

      mockPrismaService.vehiculo.delete.mockRejectedValue(otherError);

      await expect(service.removeVehiculo(1)).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
    });
  });

  describe('registrarDocumento', () => {
    it('debería registrar un documento con descripción', async () => {
      const documento = {
        id: 1,
        tipo: 'pdf',
        url: '/ruta/al/documento.pdf',
        fechaSubida: new Date('2024-01-01'),
        descripcion: 'Informe de diagnóstico',
        vehiculoId: 1,
      };

      mockPrismaService.documento.create.mockResolvedValue(documento);

      const result = await service.registrarDocumento(1, 'pdf', '/ruta/al/documento.pdf', 'Informe de diagnóstico');

      expect(result).toEqual(documento);
      expect(mockPrismaService.documento.create).toHaveBeenCalledWith({
        data: {
          vehiculoId: 1,
          tipo: 'pdf',
          url: '/ruta/al/documento.pdf',
          descripcion: 'Informe de diagnóstico',
        },
      });
    });

    it('debería registrar un documento sin descripción', async () => {
      const documento = {
        id: 1,
        tipo: 'pdf',
        url: '/ruta/al/documento.pdf',
        fechaSubida: new Date('2024-01-01'),
        descripcion: null,
        vehiculoId: 1,
      };

      mockPrismaService.documento.create.mockResolvedValue(documento);

      const result = await service.registrarDocumento(1, 'pdf', '/ruta/al/documento.pdf');

      expect(result).toEqual(documento);
      expect(result.descripcion).toBeNull();
      expect(mockPrismaService.documento.create).toHaveBeenCalledWith({
        data: {
          vehiculoId: 1,
          tipo: 'pdf',
          url: '/ruta/al/documento.pdf',
          descripcion: undefined,
        },
      });
    });

    it('debería lanzar error cuando el vehículo no existe', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '4.0.0',
      } as any);

      mockPrismaService.documento.create.mockRejectedValue(prismaError);

      await expect(service.registrarDocumento(999, 'pdf', '/ruta/al/documento.pdf')).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError,
      );
    });
  });

  // Tests adicionales para casos edge
  describe('casos edge', () => {
    it('debería manejar capacidad cero', async () => {
      const createVehiculoDto: CreateVehiculoDto = {
        patente: 'ZERO123',
        capacidad: 0,
        odometro: 50000,
        estado: 'disponible',
      };

      const expectedResult = {
        id: 3,
        ...createVehiculoDto,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrismaService.vehiculo.create.mockResolvedValue(expectedResult);

      const result = await service.createVehiculos(createVehiculoDto);

      expect(result.capacidad).toBe(0);
    });

    it('debería manejar odometro cero', async () => {
      const createVehiculoDto: CreateVehiculoDto = {
        patente: 'NEW123',
        capacidad: 20000,
        odometro: 0,
        estado: 'disponible',
      };

      const expectedResult = {
        id: 4,
        ...createVehiculoDto,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrismaService.vehiculo.create.mockResolvedValue(expectedResult);

      const result = await service.createVehiculos(createVehiculoDto);

      expect(result.odometro).toBe(0);
    });

    it('debería manejar actualización parcial', async () => {
      const updateVehiculoDto: UpdateVehiculoDto = { odometro: 60000 };

      const vehiculoActualizado = {
        id: 1,
        patente: 'ABC123',
        capacidad: 20000,
        odometro: 60000,
        estado: 'disponible',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockPrismaService.vehiculo.update.mockResolvedValue(vehiculoActualizado);

      const result = await service.updateVehiculo(1, updateVehiculoDto);

      expect(result.odometro).toBe(60000);
      expect(result.estado).toBe('disponible'); // No debería cambiar
    });
  });
});
