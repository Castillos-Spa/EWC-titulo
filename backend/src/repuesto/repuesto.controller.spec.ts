// repuesto.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RepuestoController } from './repuesto.controller';
import { RepuestoService } from './repuesto.service';
import { CreateRepuestoDto } from './dto/create-repuesto.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockRepuestoService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  updateStock: jest.fn(),
  generarAlertaStockMinimo: jest.fn(),
  remove: jest.fn(),
};

describe('RepuestoController', () => {
  let controller: RepuestoController;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepuestoController],
      providers: [
        {
          provide: RepuestoService,
          useValue: mockRepuestoService,
        },
      ],
    }).compile();

    controller = module.get<RepuestoController>(RepuestoController);
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

      mockRepuestoService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createRepuestoDto);

      expect(result).toEqual(expectedResult);
      expect(mockRepuestoService.create).toHaveBeenCalledWith(createRepuestoDto);
    });

    it('debería lanzar error con datos inválidos', async () => {
      const createRepuestoDto: CreateRepuestoDto = {
        nombre: '', // nombre vacío
        stock: -10, // stock negativo
        costoUnitario: -5, // costo negativo
      };

      mockRepuestoService.create.mockRejectedValue(new BadRequestException('Datos inválidos'));

      await expect(controller.create(createRepuestoDto)).rejects.toThrow(BadRequestException);
      expect(mockRepuestoService.create).toHaveBeenCalledWith(createRepuestoDto);
    });

    it('debería crear repuesto con solicitudCompraId opcional', async () => {
      const createRepuestoDto: CreateRepuestoDto = {
        nombre: 'Filtro de aceite',
        stock: 50,
        costoUnitario: 25.99,
        solicitudCompraId: 1,
      };

      const expectedResult = {
        id: 2,
        ...createRepuestoDto,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockRepuestoService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createRepuestoDto);

      expect(result.solicitudCompraId).toBe(1);
    });
  });

  describe('findAll', () => {
    it('debería retornar array vacío cuando no hay repuestos', async () => {
      mockRepuestoService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(mockRepuestoService.findAll).toHaveBeenCalled();
    });

    it('debería retornar todos los repuestos con sus solicitudes', async () => {
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
        {
          id: 2,
          nombre: 'Bujías',
          stock: 20,
          costoUnitario: 15.5,
          solicitudCompraId: null,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          solicitudCompra: null,
        },
      ];

      mockRepuestoService.findAll.mockResolvedValue(repuestos);

      const result = await controller.findAll();

      expect(result).toEqual(repuestos);
      expect(result).toHaveLength(2);
      expect(mockRepuestoService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debería encontrar un repuesto por ID', async () => {
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

      mockRepuestoService.findOne.mockResolvedValue(repuesto);

      const result = await controller.findOne(1);

      expect(result).toEqual(repuesto);
      expect(mockRepuestoService.findOne).toHaveBeenCalledWith(1);
    });

    it('debería lanzar NotFoundException cuando el repuesto no existe', async () => {
      mockRepuestoService.findOne.mockRejectedValue(new NotFoundException('Repuesto no encontrado'));

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockRepuestoService.findOne).toHaveBeenCalledWith(999);
    });

    it('debería retornar null cuando el repuesto no existe (sin error)', async () => {
      mockRepuestoService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(999);

      expect(result).toBeNull();
      expect(mockRepuestoService.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('updateStock', () => {
    it('debería actualizar el stock de un repuesto', async () => {
      const repuestoActualizado = {
        id: 1,
        nombre: 'Filtro de aceite',
        stock: 30,
        costoUnitario: 25.99,
        solicitudCompraId: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockRepuestoService.updateStock.mockResolvedValue(repuestoActualizado);

      const result = await controller.updateStock(1, 30);

      expect(result).toEqual(repuestoActualizado);
      expect(result.stock).toBe(30);
      expect(mockRepuestoService.updateStock).toHaveBeenCalledWith(1, 30);
    });

    it('debería lanzar error al actualizar stock de repuesto inexistente', async () => {
      mockRepuestoService.updateStock.mockRejectedValue(new NotFoundException('Repuesto no encontrado'));

      await expect(controller.updateStock(999, 30)).rejects.toThrow(NotFoundException);
      expect(mockRepuestoService.updateStock).toHaveBeenCalledWith(999, 30);
    });

    it('debería lanzar error con stock negativo', async () => {
      mockRepuestoService.updateStock.mockRejectedValue(new BadRequestException('Stock no puede ser negativo'));

      await expect(controller.updateStock(1, -10)).rejects.toThrow(BadRequestException);
    });
  });

  describe('generarAlertaStockMinimo', () => {
    it('debería generar alerta de stock mínimo', async () => {
      const repuesto = {
        id: 1,
        nombre: 'Filtro de aceite',
        stock: 5,
        costoUnitario: 25.99,
        solicitudCompraId: 1,
      };

      mockRepuestoService.generarAlertaStockMinimo.mockResolvedValue(repuesto);

      const result = await controller.generarAlertaStockMinimo(1, {
        stockMinimo: 10,
      });

      expect(result).toEqual(repuesto);
      expect(mockRepuestoService.generarAlertaStockMinimo).toHaveBeenCalledWith(1, 10);
    });

    it('debería lanzar error al generar alerta para repuesto inexistente', async () => {
      mockRepuestoService.generarAlertaStockMinimo.mockRejectedValue(new NotFoundException('Repuesto no encontrado'));

      await expect(
        controller.generarAlertaStockMinimo(999, {
          stockMinimo: 10,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería no generar alerta cuando stock es suficiente', async () => {
      const repuesto = {
        id: 1,
        nombre: 'Filtro de aceite',
        stock: 15,
        costoUnitario: 25.99,
        solicitudCompraId: 1,
      };

      mockRepuestoService.generarAlertaStockMinimo.mockResolvedValue(repuesto);

      const result = await controller.generarAlertaStockMinimo(1, {
        stockMinimo: 10,
      });

      expect(result.stock).toBe(15);
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

      mockRepuestoService.remove.mockResolvedValue(repuestoEliminado);

      const result = await controller.remove(1);

      expect(result).toEqual(repuestoEliminado);
      expect(mockRepuestoService.remove).toHaveBeenCalledWith(1);
    });

    it('debería lanzar error al eliminar repuesto inexistente', async () => {
      mockRepuestoService.remove.mockRejectedValue(new NotFoundException('Repuesto no encontrado'));

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockRepuestoService.remove).toHaveBeenCalledWith(999);
    });
  });

  describe('casos edge', () => {
    it('debería manejar stock cero', async () => {
      const repuestoActualizado = {
        id: 1,
        nombre: 'Filtro de aceite',
        stock: 0,
        costoUnitario: 25.99,
        solicitudCompraId: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockRepuestoService.updateStock.mockResolvedValue(repuestoActualizado);

      const result = await controller.updateStock(1, 0);

      expect(result.stock).toBe(0);
    });

    it('debería manejar stock muy alto', async () => {
      const repuestoActualizado = {
        id: 1,
        nombre: 'Filtro de aceite',
        stock: 10000,
        costoUnitario: 25.99,
        solicitudCompraId: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockRepuestoService.updateStock.mockResolvedValue(repuestoActualizado);

      const result = await controller.updateStock(1, 10000);

      expect(result.stock).toBe(10000);
    });

    it('debería manejar costo unitario cero', async () => {
      const createRepuestoDto: CreateRepuestoDto = {
        nombre: 'Repuesto gratuito',
        stock: 50,
        costoUnitario: 0,
      };

      const expectedResult = {
        id: 3,
        ...createRepuestoDto,
        solicitudCompraId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockRepuestoService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createRepuestoDto);

      expect(result.costoUnitario).toBe(0);
    });

    it('debería manejar repuesto sin solicitud de compra', async () => {
      const repuesto = {
        id: 2,
        nombre: 'Bujías',
        stock: 20,
        costoUnitario: 15.5,
        solicitudCompraId: null,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        solicitudCompra: null,
      };

      mockRepuestoService.findOne.mockResolvedValue(repuesto);

      const result = await controller.findOne(2);

      expect(result).toEqual(repuesto);
      expect(result?.solicitudCompraId).toBeNull();
      expect(result?.solicitudCompra).toBeNull();
    });
  });
});
