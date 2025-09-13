import { Test, TestingModule } from '@nestjs/testing';
import { SolicitudCompraController } from './solicitud-compra.controller';
import { SolicitudCompraService } from './solicitud-compra.service';
import { CreateSolicitudCompraDto } from './dto/create-solicitud-compra.dto';
import { NotFoundException } from '@nestjs/common';

// Mock completo del SolicitudCompraService
const mockSolicitudCompraService = {
  createSolicitudCompra: jest.fn(),
  findAllSolicitudCompra: jest.fn(),
  findOneSolicitudCompra: jest.fn(),
  removeSolicitudCompra: jest.fn(),
  aprobarSolicitud: jest.fn(),
};

describe('SolicitudCompraController', () => {
  let controller: SolicitudCompraController;
  let service: SolicitudCompraService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SolicitudCompraController],
      providers: [
        {
          provide: SolicitudCompraService,
          useValue: mockSolicitudCompraService,
        },
      ],
    }).compile();

    controller = module.get<SolicitudCompraController>(SolicitudCompraController);
    service = module.get<SolicitudCompraService>(SolicitudCompraService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería crear una solicitud de compra', async () => {
      const createSolicitudCompraDto: CreateSolicitudCompraDto = {
        monto: 1000,
      };

      const expectedResult = {
        id: 1,
        monto: 1000,
        aprobada: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockSolicitudCompraService.createSolicitudCompra.mockResolvedValue(expectedResult);

      const result = await controller.create(createSolicitudCompraDto);

      expect(result).toEqual(expectedResult);
      expect(mockSolicitudCompraService.createSolicitudCompra).toHaveBeenCalledWith(createSolicitudCompraDto);
    });
  });

  describe('findAll', () => {
    it('debería retornar todas las solicitudes', async () => {
      const solicitudes = [
        {
          id: 1,
          monto: 1000,
          aprobada: false,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          repuestos: [],
        },
      ];

      mockSolicitudCompraService.findAllSolicitudCompra.mockResolvedValue(solicitudes);

      const result = await controller.findAll();

      expect(result).toEqual(solicitudes);
      expect(mockSolicitudCompraService.findAllSolicitudCompra).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debería encontrar una solicitud por ID', async () => {
      const solicitud = {
        id: 1,
        monto: 1000,
        aprobada: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        repuestos: [],
      };

      mockSolicitudCompraService.findOneSolicitudCompra.mockResolvedValue(solicitud);

      const result = await controller.findOne('1');

      expect(result).toEqual(solicitud);
      expect(mockSolicitudCompraService.findOneSolicitudCompra).toHaveBeenCalledWith(1);
    });

    it('debería lanzar error cuando la solicitud no existe', async () => {
      mockSolicitudCompraService.findOneSolicitudCompra.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('debería eliminar una solicitud', async () => {
      const solicitudEliminada = {
        id: 1,
        monto: 1000,
        aprobada: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockSolicitudCompraService.removeSolicitudCompra.mockResolvedValue(solicitudEliminada);

      const result = await controller.remove('1');

      expect(result).toEqual(solicitudEliminada);
      expect(mockSolicitudCompraService.removeSolicitudCompra).toHaveBeenCalledWith(1);
    });
  });

  describe('aprobarSolicitud', () => {
    it('debería aprobar una solicitud', async () => {
      const solicitudAprobada = {
        id: 1,
        monto: 1000,
        aprobada: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockSolicitudCompraService.aprobarSolicitud.mockResolvedValue(solicitudAprobada);

      const result = await controller.aprobarSolicitud('1');

      expect(result).toEqual(solicitudAprobada);
      expect(result.aprobada).toBe(true);
      expect(mockSolicitudCompraService.aprobarSolicitud).toHaveBeenCalledWith(1);
    });

    it('debería lanzar error al aprobar solicitud inexistente', async () => {
      mockSolicitudCompraService.aprobarSolicitud.mockRejectedValue(new NotFoundException());

      await expect(controller.aprobarSolicitud('999')).rejects.toThrow(NotFoundException);
    });
  });
});
