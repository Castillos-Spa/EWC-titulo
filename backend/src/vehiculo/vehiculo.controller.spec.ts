// vehiculo.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { VehiculoController } from './vehiculo.controller';
import { VehiculoService } from './vehiculo.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Mock completo del VehiculoService con los nombres correctos de métodos
const mockVehiculoService = {
  createVehiculos: jest.fn(),
  findAllVehiculos: jest.fn(),
  findOneVehiculos: jest.fn(),
  updateVehiculo: jest.fn(),
  removeVehiculo: jest.fn(),
  registrarDocumento: jest.fn(),
};

describe('VehiculoController', () => {
  let controller: VehiculoController;
  let service: VehiculoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiculoController],
      providers: [
        {
          provide: VehiculoService,
          useValue: mockVehiculoService,
        },
      ],
    }).compile();

    controller = module.get<VehiculoController>(VehiculoController);
    module.get<VehiculoService>(VehiculoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
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

      mockVehiculoService.createVehiculos.mockResolvedValue(expectedResult);

      const result = await controller.create(createVehiculoDto);

      expect(result).toEqual(expectedResult);
      expect(mockVehiculoService.createVehiculos).toHaveBeenCalledWith(createVehiculoDto);
    });

    it('debería lanzar error con datos inválidos', async () => {
      const createVehiculoDto: CreateVehiculoDto = {
        patente: 'AB', // demasiado corto
        capacidad: -100, // capacidad negativa
        odometro: 50000,
        estado: 'disponible',
      };

      mockVehiculoService.createVehiculos.mockRejectedValue(new BadRequestException('Datos inválidos'));

      await expect(controller.create(createVehiculoDto)).rejects.toThrow(BadRequestException);
      expect(mockVehiculoService.createVehiculos).toHaveBeenCalledWith(createVehiculoDto);
    });
  });

  describe('findAll', () => {
    it('debería retornar array vacío cuando no hay vehículos', async () => {
      mockVehiculoService.findAllVehiculos.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(mockVehiculoService.findAllVehiculos).toHaveBeenCalled();
    });

    it('debería listar todos los vehículos', async () => {
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

      mockVehiculoService.findAllVehiculos.mockResolvedValue(vehiculos);

      const result = await controller.findAll();

      expect(result).toEqual(vehiculos);
      expect(result).toHaveLength(2);
      expect(mockVehiculoService.findAllVehiculos).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
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

      mockVehiculoService.findOneVehiculos.mockResolvedValue(vehiculo);

      const result = await controller.findOne('ABC123');

      expect(result).toEqual(vehiculo);
      expect(mockVehiculoService.findOneVehiculos).toHaveBeenCalledWith('ABC123');
    });

    it('debería lanzar NotFoundException cuando el vehículo no existe', async () => {
      mockVehiculoService.findOneVehiculos.mockRejectedValue(new NotFoundException('Vehículo no encontrado'));

      await expect(controller.findOne('PATENTE999')).rejects.toThrow(NotFoundException);
      expect(mockVehiculoService.findOneVehiculos).toHaveBeenCalledWith('PATENTE999');
    });

    it('debería retornar null cuando el vehículo no existe (sin error)', async () => {
      mockVehiculoService.findOneVehiculos.mockResolvedValue(null);

      const result = await controller.findOne('PATENTE999');

      expect(result).toBeNull();
      expect(mockVehiculoService.findOneVehiculos).toHaveBeenCalledWith('PATENTE999');
    });
  });

  describe('update', () => {
    it('debería actualizar un vehículo por ID', async () => {
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

      mockVehiculoService.updateVehiculo.mockResolvedValue(vehiculoActualizado);

      const result = await controller.update('1', updateVehiculoDto);

      expect(result).toEqual(vehiculoActualizado);
      expect(result.estado).toBe('en_mantenimiento');
      expect(mockVehiculoService.updateVehiculo).toHaveBeenCalledWith(1, updateVehiculoDto);
    });

    it('debería lanzar error al actualizar vehículo inexistente', async () => {
      const updateVehiculoDto: UpdateVehiculoDto = { estado: 'en_mantenimiento' };

      mockVehiculoService.updateVehiculo.mockRejectedValue(new NotFoundException('Vehículo no encontrado'));

      await expect(controller.update('999', updateVehiculoDto)).rejects.toThrow(NotFoundException);
      expect(mockVehiculoService.updateVehiculo).toHaveBeenCalledWith(999, updateVehiculoDto);
    });
  });

  describe('remove', () => {
    it('debería eliminar un vehículo existente', async () => {
      const vehiculoEliminado = {
        id: 1,
        patente: 'ABC123',
        capacidad: 20000,
        odometro: 50000,
        estado: 'inactivo',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockVehiculoService.removeVehiculo.mockResolvedValue(vehiculoEliminado);

      const result = await controller.remove('1');

      expect(result).toEqual(vehiculoEliminado);
      expect(mockVehiculoService.removeVehiculo).toHaveBeenCalledWith(1);
    });

    it('debería lanzar error al eliminar vehículo inexistente', async () => {
      mockVehiculoService.removeVehiculo.mockRejectedValue(new NotFoundException('Vehículo no encontrado'));

      await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('registrarDocumento', () => {
    it('debería registrar un documento para un vehículo', async () => {
      const documento = {
        id: 1,
        tipo: 'pdf',
        url: '/ruta/al/documento.pdf',
        fechaSubida: new Date('2024-01-01'),
        descripcion: 'Informe de diagnóstico',
        vehiculoId: 1,
      };

      mockVehiculoService.registrarDocumento.mockResolvedValue(documento);

      const result = await controller.registrarDocumento('1', {
        tipo: 'pdf',
        url: '/ruta/al/documento.pdf',
        descripcion: 'Informe de diagnóstico',
      });

      expect(result).toEqual(documento);
      expect(mockVehiculoService.registrarDocumento).toHaveBeenCalledWith(
        1,
        'pdf',
        '/ruta/al/documento.pdf',
        'Informe de diagnóstico',
      );
    });

    it('debería lanzar error al registrar documento en vehículo inexistente', async () => {
      mockVehiculoService.registrarDocumento.mockRejectedValue(new NotFoundException('Vehículo no encontrado'));

      await expect(
        controller.registrarDocumento('999', {
          tipo: 'pdf',
          url: '/ruta/al/documento.pdf',
          descripcion: 'Informe de diagnóstico',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería manejar documento sin descripción', async () => {
      const documento = {
        id: 1,
        tipo: 'pdf',
        url: '/ruta/al/documento.pdf',
        fechaSubida: new Date('2024-01-01'),
        descripcion: null,
        vehiculoId: 1,
      };

      mockVehiculoService.registrarDocumento.mockResolvedValue(documento);

      const result = await controller.registrarDocumento('1', {
        tipo: 'pdf',
        url: '/ruta/al/documento.pdf',
      });

      expect(result.descripcion).toBeNull();
      expect(mockVehiculoService.registrarDocumento).toHaveBeenCalledWith(
        1,
        'pdf',
        '/ruta/al/documento.pdf',
        undefined,
      );
    });
  });
});
