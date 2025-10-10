// vehiculo.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { VehiculoService } from './vehiculo.service';
import { PrismaService } from 'prisma/prisma.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma, Vehiculo } from '@prisma/client';

// Mock completo de PrismaService
const mockPrismaService = {
  vehiculo: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  documento: {
    create: jest.fn(),
  },
  $transaction: jest.fn().mockImplementation(callback => {
    // Simula la ejecución de la transacción llamando al callback con el mock de prisma
    return callback(mockPrismaService);
  }),
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

  describe('create', () => {
    it('debería crear un vehículo exitosamente', async () => {
      const createVehiculoDto: CreateVehiculoDto = {
        patente: ' abc-123 ',
        capacidad: 20000,
        odometro: 50000,
        estado: 'disponible',
      };

      const expectedResult: Vehiculo = {
        id: 1,
        ...createVehiculoDto,
        patente: 'ABC-123', // Patente normalizada
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        areaAsignada: null,
        conductorId: null,
        lastMaintenanceDate: null,
        marca: '',
        modelo: '',
      };

      mockPrismaService.vehiculo.findUnique.mockResolvedValue(null);
      mockPrismaService.vehiculo.create.mockResolvedValue(expectedResult);

      const result = await service.create(createVehiculoDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.vehiculo.findUnique).toHaveBeenCalledWith({
        where: { patente: 'ABC-123' },
      });
      expect(mockPrismaService.vehiculo.create).toHaveBeenCalledWith({
        data: { ...createVehiculoDto, patente: 'ABC-123' },
      });
    });

    it('debería lanzar ConflictException si la patente ya existe', async () => {
      const createVehiculoDto: CreateVehiculoDto = {
        patente: 'ABC123',
        capacidad: 20000,
        odometro: 50000,
        estado: 'disponible',
      };
      mockPrismaService.vehiculo.findUnique.mockResolvedValue({ id: 1, patente: 'ABC123' });

      await expect(service.create(createVehiculoDto)).rejects.toThrow(
        new ConflictException(`El vehículo con patente ABC123 ya existe.`),
      );
    });
  });

  describe('findAll', () => {
    it('debería retornar una lista paginada de vehículos y el total', async () => {
      const mockVehiculos = [{ id: 1, patente: 'ABC-123' }];
      const mockTotal = 1;

      // Configura el mock de $transaction para que devuelva los resultados simulados
      mockPrismaService.$transaction.mockResolvedValue([mockVehiculos, mockTotal]);

      const result = await service.findAll({ take: 10, skip: 0 });

      expect(result.items).toEqual(mockVehiculos);
      expect(result.total).toBe(mockTotal);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.vehiculo.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10, skip: 0 }));
      expect(mockPrismaService.vehiculo.count).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debería retornar un vehículo por ID', async () => {
      const vehiculo = { id: 1, patente: 'ABC-123' };
      mockPrismaService.vehiculo.findUnique.mockResolvedValue(vehiculo);

      const result = await service.findOne(1);

      expect(result).toEqual(vehiculo);
      expect(mockPrismaService.vehiculo.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });

    it('debería lanzar NotFoundException si el vehículo no se encuentra', async () => {
      mockPrismaService.vehiculo.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByPatente', () => {
    it('debería encontrar un vehículo por patente', async () => {
      const vehiculo = { id: 1, patente: 'ABC-123' };
      mockPrismaService.vehiculo.findFirst.mockResolvedValue(vehiculo);

      const result = await service.findByPatente(' abc-123 ');

      expect(result).toEqual(vehiculo);
      expect(mockPrismaService.vehiculo.findFirst).toHaveBeenCalledWith({
        where: { patente: 'ABC-123' },
        include: expect.any(Object),
      });
    });

    it('debería retornar null cuando el vehículo no existe', async () => {
      mockPrismaService.vehiculo.findFirst.mockResolvedValue(null);
      const result = await service.findByPatente('NON-EXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('debería actualizar un vehículo exitosamente', async () => {
      const updateDto = { estado: 'en_mantenimiento' };
      const existingVehicle = { id: 1, patente: 'ABC-123' };
      const updatedVehicle = { ...existingVehicle, ...updateDto };

      // Mock para la verificación interna de findOne
      mockPrismaService.vehiculo.findUnique.mockResolvedValue(existingVehicle);
      // Mock para la operación de actualización
      mockPrismaService.vehiculo.update.mockResolvedValue(updatedVehicle);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(updatedVehicle);
      expect(mockPrismaService.vehiculo.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
      expect(mockPrismaService.vehiculo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
        include: expect.any(Object),
      });
    });

    it('debería lanzar NotFoundException cuando el vehículo a actualizar no existe', async () => {
      mockPrismaService.vehiculo.findUnique.mockResolvedValue(null);
      await expect(service.update(999, { estado: 'disponible' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove (soft delete)', () => {
    it('debería cambiar el estado de un vehículo a "inactivo"', async () => {
      const existingVehicle = { id: 1, patente: 'ABC-123', estado: 'disponible' };
      const updatedVehicle = { ...existingVehicle, estado: 'inactivo' };

      mockPrismaService.vehiculo.findUnique.mockResolvedValue(existingVehicle);
      mockPrismaService.vehiculo.update.mockResolvedValue(vehiculoActualizado);

      const result = await service.remove(1);

      expect(result).toEqual(updatedVehicle);
      expect(mockPrismaService.vehiculo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { estado: 'inactivo' },
      });
    });

    it('debería lanzar NotFoundException si el vehículo a remover no existe', async () => {
      mockPrismaService.vehiculo.findUnique.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('registrarDocumento', () => {
    it('debería registrar un documento con descripción', async () => {
      const documento = {
        id: 1,
        tipo: 'pdf',
        url: 'http://example.com/doc.pdf',
        fechaSubida: new Date('2024-01-01'),
        descripcion: 'Informe de diagnóstico',
        vehiculoId: 1,
        ticketId: null,
      };

      mockPrismaService.documento.create.mockResolvedValue(documento);

      const result = await service.registrarDocumento(1, 'pdf', 'http://example.com/doc.pdf', 'Informe de diagnóstico');

      expect(result).toEqual(documento);
      expect(mockPrismaService.documento.create).toHaveBeenCalledWith({
        data: {
          vehiculoId: 1,
          tipo: 'pdf',
          url: '/ruta/al/documento.pdf',
          url: 'http://example.com/doc.pdf',
          descripcion: 'Informe de diagnóstico',
        },
      });
    });
  });
});
